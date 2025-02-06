import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ExamAttemptService } from './exam-attempt.service';
import { UseGuards } from '@nestjs/common';
import { StudentWsGuard } from 'src/guards/student-ws.guard';
import { Judge0Provider } from 'src/providers/external/judge0.provider';
import { ExamSetType } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(StudentWsGuard)
export class ExamAttemptGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Sửa type của timers
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(
    private readonly examAttemptService: ExamAttemptService,
    private readonly judge0Provider: Judge0Provider
  ) { }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token || client.handshake.query.token;
    // console.log(`Client connected: ${client.id}`);
    // console.log(`Token: ${token}`);
    // console.log(`IP: ${client.handshake.address}`);
    // console.log(`User Agent: ${client.handshake.headers['user-agent']}`);
  }

  async handleDisconnect(client: Socket) {
   // console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinExamAttempt')
  async handleJoinExamAttempt(
    @MessageBody() attemptId: number,
    @ConnectedSocket() client: Socket
  ) {
    try {
      // console.log('handleJoinExamAttempt', attemptId, client);
      // console.log(`Client ${client.id} attempting to join exam ${attemptId}`);
      // console.log(`Student ID: ${client.data?.student?.id}`);

      // 1. Kiểm tra phiên thi tồn tại
      const attempt = await this.examAttemptService.findById(attemptId);
      if (!attempt) {
        //console.log(`Exam attempt ${attemptId} not found for client ${client.id}`);
        client.emit('error', {
          message: ['SV_ERR_EXAM_ATTEMPT_NOT_FOUND'],
          description: 'Không tìm thấy phiên thi'
        });
        return;
      }

      // 2. Kiểm tra quyền truy cập
      const studentId = client.data?.student?.id;
      if (attempt.studentId !== studentId) {
        //console.log(`Unauthorized access to exam ${attemptId} by student ${studentId}`);
        client.emit('error', {
          message: ['SV_ERR_UNAUTHORIZED_ACCESS'],
          description: 'Không có quyền truy cập phiên thi này'
        });
        return;
      }

      // 3. Kiểm tra và xử lý thời gian thi
      const startTime = new Date(attempt.startTime).getTime();
      const timeLimit = attempt.examSet.timeLimit * 60 * 1000;
      const shouldEndTime = startTime + timeLimit;
      const now = new Date().getTime();

      if (now >= shouldEndTime && !attempt.endTime) {
        // Cập nhật endTime nếu đã hết giờ
        await this.examAttemptService.updateEndTime(attemptId, new Date(shouldEndTime));
        client.emit('error', {
          message: ['SV_ERR_EXAM_ENDED'],
          description: 'Phiên thi đã kết thúc'
        });
        return;
      }

      if (attempt.endTime) {
        client.emit('error', {
          message: ['SV_ERR_EXAM_ENDED'],
          description: 'Phiên thi đã kết thúc'
        });
        return;
      }

      // 4. Lấy và xử lý danh sách câu hỏi
      const attemptQuestions = await this.examAttemptService.findQuestionsForAttempt(attemptId);
      if (!attemptQuestions) return null;

      let questions;
      if (attemptQuestions.orderQuestionList) {
        const orderIds = attemptQuestions.orderQuestionList.split(',').map(Number);
        questions = await this.examAttemptService.findQuestionsByIds(orderIds);
      } else {
        questions = attemptQuestions.examSet.questions.map(q => q.question);
      }

      // Random và lưu thứ tự câu hỏi nếu chưa có
      if (!attemptQuestions.orderQuestionList) {
        const shuffledQuestions = this.shuffleArray([...questions]);
        const orderQuestionList = shuffledQuestions.map(q => q.id).join(',');
        await this.examAttemptService.updateOrderQuestionList(attemptId, orderQuestionList);
        questions = shuffledQuestions;
      }

      // Lọc bỏ các trường nhạy cảm
      const safeQuestions = questions.map(q => ({
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        choiceList: q.choiceList,
        codingInitCode: q.codingInitCode,
        codingTestCases: q.codingTestCases,
        codingPerformanceCheck: q.codingPerformanceCheck,
        codingTimeLimit: q.codingTimeLimit,
        codingMemoryLimit: q.codingMemoryLimit,
        fillCaseSensitive: q.fillCaseSensitive,
        languageId: q.languageId,
      }));

      // 5. Join room
      const roomId = `exam-attempt:${attemptId}`;
      await client.join(roomId);
      //console.log(`Client ${client.id} joined room ${roomId}`);

      // 6. Thiết lập timer
      this.setupExamTimer(client, attempt);

      // 7. Gửi thông báo thành công
      client.emit('joinExamAttemptSuccess', {
        message: ['SV_NOTICE_JOIN_EXAM_SUCCESS'],
        description: 'Đã tham gia phiên thi thành công',
        data: {
          ...attempt,
          safeQuestions
        }
      });

      // Sau khi join room thành công
      const examState = await this.getExamAttemptState(attemptId);
      client.emit('examAttemptState', examState);

    } catch (error) {
      //console.log(`Error in joinExamAttempt: ${error.message}`, error.stack);
      client.emit('error', {
        message: ['SV_ERR_JOIN_EXAM_FAILED'],
        description: 'Có lỗi xảy ra khi tham gia phiên thi'
      });
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private setupExamTimer(client: Socket, attempt: any) {
    // Clear existing timer if any
    const existingTimer = this.timers.get(client.id);
    if (existingTimer) {
      clearInterval(existingTimer);
      this.timers.delete(client.id);
    }

    // console.log('Setting up timer for attempt:', attempt);
    // console.log('Start time:', attempt.startTime);
    // console.log('Time limit:', attempt.examSet.timeLimit);

    const startTime = new Date(attempt.startTime).getTime();
    const timeLimit = attempt.examSet.timeLimit * 60 * 1000; // Convert to milliseconds
    const endTime = startTime + timeLimit;

    // Set up interval to emit time every second
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const timeLeft = endTime - now;

      //console.log('Time left:', timeLeft);

      if (timeLeft <= 0) {
        // Hết giờ
        clearInterval(timer);
        this.timers.delete(client.id);
        client.emit('examTimeUp');
        return;
      }

      // Convert to HH:MM:SS format
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      client.emit('examTimeUpdate', {
        timeLeft: timeString,
        totalSeconds: Math.floor(timeLeft / 1000)
      });
    }, 1000);

    // Store the timer
    this.timers.set(client.id, timer);

    // Clean up timer when client disconnects
    client.on('disconnect', () => {
      clearInterval(timer);
      this.timers.delete(client.id);
    });
  }

  private handleMultipleChoice(question: any, answer: string): QuestionResult {
    console.log("question", question);
  
    let selectedChoice = question.choiceList.split(',');

    // console.log("answer", answer);

    // console.log("selectedChoice", selectedChoice[+question.choiceCorrectIndex]);

    // #bug001 xử lý lại logic

    const isCorrect = answer == selectedChoice[+question.choiceCorrectIndex - 1].trim();
    return {
      isCorrect,
      result: `Nộp đáp án thành công, câu trắc nghiệm chỉ có thể nộp 1 lần`,
      totalCases: 1,
      passedCases: isCorrect ? 1 : 0
    }; 
  }

  private async handleCodingQuestion(question: any, answer: string): Promise<QuestionResult> {
    try {
        const testCases = JSON.parse(question.codingTestCases);
        let allTestsPassed = true;
        let casesPassed = 0;
        const testCaseResults: TestCaseResult[] = [];

        // Chuẩn hóa code người dùng theo ngôn ngữ
        let normalizedAnswer = answer;
        if (question.languageId === 49) { // C
            // Loại bỏ các từ khóa Java/C#
            normalizedAnswer = answer
                .replace(/public\s+static\s+/g, '')  // Loại bỏ public static
                .replace(/static\s+/g, '')          // Loại bỏ static
                .replace(/public\s+/g, '')          // Loại bỏ public
                .replace(/private\s+/g, '')         // Loại bỏ private
                .replace(/protected\s+/g, '');      // Loại bỏ protected
        }

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            let completeCode: string;

            switch (question.languageId) {
                case 70: // Python
                    completeCode = `# User code
${normalizedAnswer}

# Test case execution
input_str = "${testCase.input}"
${question.codingTestTemplate}
`;
                    break;

                case 63: // JavaScript
                    completeCode = `// User code
${normalizedAnswer}

// Test case execution
const input = "${testCase.input}";
${question.codingTestTemplate}
`;
                    break;

                case 62: // Java
                    completeCode = `
public class Main {
    // User code
    ${normalizedAnswer}

    public static void main(String[] args) {
        // Test case execution
        String input = "${testCase.input}";
        ${question.codingTestTemplate}
        System.out.flush();
    }
}`;
                    break;

                case 49: // C
                    const encodedInput = testCase.input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                    completeCode = `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Function prototype
${normalizedAnswer.includes('int addNumbers') ? '' : 'int addNumbers(int a, int b);'}

// User code
${normalizedAnswer}

int main() {
    // Test case execution
    char input[] = "${encodedInput}";
    ${question.codingTestTemplate}
    fflush(stdout);
    return 0;
}`;
                    break;

                default:
                    throw new Error(`Unsupported language ID: ${question.languageId}`);
            }

            // console.log('Submitting code to Judge0:', {
            //     languageId: question.languageId,
            //     testCase,
            //     completeCode
            // });

            let resultJudge0 = await this.judge0Provider.submitCode(completeCode, question.languageId, true);
            
            // Decode tất cả các output có thể có từ Judge0
            const stdout = resultJudge0.stdout ? Buffer.from(resultJudge0.stdout, 'base64').toString() : '';
            const stderr = resultJudge0.stderr ? Buffer.from(resultJudge0.stderr, 'base64').toString() : '';
            const compileOutput = resultJudge0.compile_output ? 
                Buffer.from(resultJudge0.compile_output, 'base64').toString() : '';

            // Xử lý kết quả dựa trên status
            const isAccepted = resultJudge0.status.id === 3;
            let output = '';
            
            if (isAccepted) {
                output = stdout.trim();
            } else if (resultJudge0.status.id === 6) { // Compilation Error
                output = `Compilation Error:\n${compileOutput}`;
            } else {
                output = stderr || stdout || compileOutput || 'No output';
            }

            const expectedOutput = testCase.expected.trim();
            const caseCorrect = isAccepted && output === expectedOutput;

            if (caseCorrect) casesPassed++;
            else allTestsPassed = false;

            testCaseResults.push({
                caseNumber: i + 1,
                input: testCase.input,
                expected: expectedOutput,
                output: output,
                time: +resultJudge0.time || 0,
                memory: +resultJudge0.memory || 0,
                passed: caseCorrect,
                status: resultJudge0.status
            });

            // Log kết quả chi tiết để debug
            // console.log('Judge0 Result:', {
            //     status: resultJudge0.status,
            //     stdout,
            //     stderr,
            //     compileOutput,
            //     output,
            //     expected: expectedOutput,
            //     passed: caseCorrect
            // });
        }

        return {
            totalCases: testCases.length,
            passedCases: casesPassed,
            isCorrect: allTestsPassed,
            testCases: testCaseResults
        };

    } catch (error) {
        console.error('Error processing coding submission:', error);
        return {
            isCorrect: false,
            message: 'Có lỗi xảy ra khi chấm bài',
            error: error.message
        };
    }
  }

  private handleFillInBlank(question: any, answer: string): QuestionResult {
    // Đếm số lượng {blank} trong câu hỏi
    const blankCount = (question.questionText.match(/{blank}/g) || []).length;

    // Lấy danh sách đáp án đúng
    const correctAnswers = question.fillAswer.split(',').map(ans => ans.trim());

    //console.log("userAnswers", answer);
    // Lấy danh sách đáp án của user
    const userAnswers = answer.split(',').map(ans => ans.trim());

    if (userAnswers.length !== blankCount) {
      return {
        isCorrect: false,
        message: `Cần điền đủ ${blankCount} vị trí`,
        totalCases: blankCount,
        passedCases: 0
      };
    }

    let correctCount = 0;
    const testCases: TestCaseResult[] = [];

    userAnswers.forEach((userAns, index) => {
      let isCorrectAnswer: boolean;

      if (question.fillCaseSensitive) {
        isCorrectAnswer = userAns === correctAnswers[index];
      } else {
        isCorrectAnswer = userAns.toLowerCase() === correctAnswers[index].toLowerCase();
      }

      if (isCorrectAnswer) correctCount++;

      testCases.push({
        caseNumber: index + 1,
        input: userAns,
        expected: correctAnswers[index],
        output: userAns,
        time: 0,
        memory: 0,
        passed: isCorrectAnswer
      });
    });

    return {
      isCorrect: correctCount === blankCount,
      totalCases: blankCount,
      passedCases: correctCount,
      testCases
    };
  }

  private handleEssay(question: any, answer: string): QuestionResult {
    // console.log('Essay question submission:', {
    //   questionId: question.id,
    //   answer,
    //   timestamp: new Date()
    // });

    return {
      isCorrect: true,
      message: "Đối với câu tiểu luận kết quả sẽ được đánh giá sau, bạn có thể thay đổi câu trả lời nếu muốn",
      totalCases: 1,
      passedCases: 1
    };
  }

  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @MessageBody() data: { attemptId: number; questionId: number; answer: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { attemptId, questionId, answer } = data;
      const studentId = client.data?.student?.id;

      // console.log('Received answer submission:', {
      //   attemptId,
      //   questionId,
      //   answer,
      //   studentId,
      //   timestamp: new Date()
      // });

      // 1. Kiểm tra phiên thi và quyền truy cập
      const attempt = await this.examAttemptService.findById(attemptId);
      if (!attempt || attempt.studentId !== studentId) {
        client.emit('error', {
          message: ['SV_ERR_UNAUTHORIZED_SUBMISSION'],
          description: 'Không có quyền nộp bài cho phiên thi này'
        });
        return;
      }

      // 2. Kiểm tra thời gian thi
      if (attempt.endTime) {
        client.emit('error', {
          message: ['SV_ERR_EXAM_ENDED'],
          description: 'Phiên thi đã kết thúc'
        });
        return;
      }

      // 3. Lấy thông tin câu hỏi
      const question = await this.examAttemptService.findQuestionById(questionId);
      if (!question) {
        client.emit('error', {
          message: ['SV_ERR_QUESTION_NOT_FOUND'],
          description: 'Không tìm thấy câu hỏi'
        });
        return;
      }

      // 4. Xử lý theo loại câu hỏi
      let result: QuestionResult;
      switch (question.type) {
        case 'MULTIPLE_CHOICE':
          result = this.handleMultipleChoice(question, answer);
          break;
        case 'CODING':
          result = await this.handleCodingQuestion(question, answer);
          break;
        case 'FILL_IN_THE_BLANK':
          result = this.handleFillInBlank(question, answer);
          break;
        case 'ESSAY':
          result = this.handleEssay(question, answer);
          break;
      }

      // Lưu submission với kết quả
      await this.examAttemptService.createSubmission({
        attemptId: +data.attemptId,
        questionId: +data.questionId,
        answer: data.answer,
        submittedAt: new Date(),
        result: JSON.stringify(result),
        isCorrect: result.isCorrect
      });

      // 5. Emit kết quả về client
      if (result) {
        client.emit('answerResult', result);
      }

      // 2. Emit lại toàn bộ trạng thái mới
      const examState = await this.getExamAttemptState(data.attemptId);
      client.emit('examAttemptState', examState);

    } catch (error) {
     //console.log(`Error in submitAnswer: ${error.message}`, error.stack);
      client.emit('error', {
        message: ['SV_ERR_SUBMIT_FAILED'],
        description: 'Có lỗi xảy ra khi nộp câu trả lời'
      });
    }
  }

  private async getExamAttemptState(attemptId: number): Promise<ExamAttemptState> {
    // 1. Lấy thông tin attempt và danh sách câu hỏi
    const attempt = await this.examAttemptService.findById(attemptId);
    const attemptQuestions = await this.examAttemptService.findQuestionsForAttempt(attemptId);

    // 2. Lấy danh sách câu hỏi theo thứ tự
    let questions;
    if (attemptQuestions.orderQuestionList) {
      const orderIds = attemptQuestions.orderQuestionList.split(',').map(Number);
      questions = await this.examAttemptService.findQuestionsByIds(orderIds);
    } else {
      questions = attemptQuestions.examSet.questions.map(q => q.question);
    }

    // 3. Lấy submissions
    const submissions = await this.examAttemptService.findSubmissionsByAttemptId(attemptId);

    // 4. Tính thời gian còn lại
    const startTime = new Date(attempt.startTime).getTime();
    const timeLimit = attempt.examSet.timeLimit * 60 * 1000;
    const shouldEndTime = startTime + timeLimit;
    const now = new Date().getTime();
    const timeRemaining = Math.max(0, shouldEndTime - now);

    // 5. Format lại dữ liệu để trả về client
    return {
      questions: questions.map(q => ({
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        choiceList: q.choiceList,
        codingInitCode: q.codingInitCode,
        languageId: q.languageId,
        // ... các trường khác cần thiết
      })),
      orderQuestionList: attemptQuestions.orderQuestionList,
      submissions: submissions.map(s => ({
        questionId: s.questionId,
        answer: s.answer,
        submittedAt: s.submittedAt,
        result: s.result,
        isCorrect: s.isCorrect
      })),
      type: attempt.examSet.type,
      timeRemaining
    };
  }

  @SubscribeMessage('finishExamAttempt')
  async handleFinishExamAttempt(
    @MessageBody() data: { attemptId: number; note?: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
        const { attemptId, note } = data;
        const studentId = client.data?.student?.id;

        // 1. Kiểm tra quyền truy cập
        const attempt = await this.examAttemptService.findById(+attemptId);
        if (!attempt || attempt.studentId !== studentId) {
            client.emit('error', {
                message: ['SV_ERR_UNAUTHORIZED_ACCESS'],
                description: 'Không có quyền truy cập phiên thi này'
            });
            return;
        }

        // 2. Kiểm tra xem bài thi đã kết thúc chưa
        if (attempt.endTime) {
            client.emit('error', {
                message: ['SV_ERR_EXAM_ENDED'],
                description: 'Phiên thi đã kết thúc'
            });
            return;
        }

        // 3. Lấy tất cả submissions và tính completion rate
        const submissions = await this.examAttemptService.findSubmissionsByAttemptId(attemptId);
        const questions = await this.examAttemptService.findQuestionsForAttempt(attemptId);
        
        // Lấy submission cuối cùng cho mỗi câu hỏi
        const lastSubmissions = new Map<number, any>();
        submissions.forEach(sub => {
            const existing = lastSubmissions.get(sub.questionId);
            if (!existing || sub.submittedAt > existing.submittedAt) {
                lastSubmissions.set(sub.questionId, sub);
            }
        });

        // Tính tỷ lệ hoàn thành dựa trên số câu đúng / tổng số câu hỏi
        const correctAnswers = Array.from(lastSubmissions.values())
            .filter(sub => sub.isCorrect).length;
        const totalQuestions = questions.examSet.questionCount;
        const completionRate = (correctAnswers / totalQuestions) * 100;

        // 4. Cập nhật attempt
        const endTime = new Date();
        await this.examAttemptService.updateAttemptCompletion(+attemptId, {
            endTime,
            completionRate,
            note: note || 'Thí sinh chủ động nộp bài'
        });

        // 5. Emit kết quả về client
        const response = {
            message: 'SV_NOTICE_EXAM_FINISHED',
            description: 'Nộp bài thi thành công',
            data: {
                attemptId,
                endTime,
                completionRate,
                totalAnswered: lastSubmissions.size,
                correctAnswers,
                note
            }
        };

        //console.log("response o day", response);
        client.emit('examFinished', response);

        // 6. Emit lại trạng thái cuối cùng của bài thi
        const examState = await this.getExamAttemptState(+attemptId);
        client.emit('examAttemptState', examState);

    } catch (error) {
        console.error('Error finishing exam attempt:', error);
        client.emit('error', {
            message: ['SV_ERR_FINISH_FAILED'],
            description: 'Có lỗi xảy ra khi nộp bài thi'
        });
    }
  }
}


interface TestCaseResult {
  caseNumber: number;
  input: string;
  expected: string;
  output: string;
  time: number;
  memory: number;
  passed: boolean;
  status?: {
    id: number;
    description: string;
  };
}

interface QuestionResult {
  totalCases?: number;
  passedCases?: number;
  isCorrect: boolean;
  testCases?: TestCaseResult[];
  message?: string;
  result?: string;
  error?: string;
}

// Thêm interface để định nghĩa cấu trúc dữ liệu
interface ExamAttemptState {
  questions: {
    id: number;
    type: string;
    questionText: string;
    choiceList?: string;
    codingInitCode?: string;
    languageId?: number;
    // ... các trường khác của câu hỏi
  }[];
  orderQuestionList: string;
  submissions: {
    questionId: number;
    answer: string;
    submittedAt: Date;
    result: string;
    isCorrect: boolean;
  }[];
  timeRemaining: number;
  type: ExamSetType;
}