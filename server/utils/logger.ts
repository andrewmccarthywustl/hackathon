import chalk from 'chalk';

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: any) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(
      chalk.blue(`[${timestamp}]`),
      chalk.cyan(`[${this.context}]`),
      message,
      data ? chalk.gray(JSON.stringify(data, null, 2)) : ''
    );
  }

  success(message: string, data?: any) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(
      chalk.blue(`[${timestamp}]`),
      chalk.green(`✓ [${this.context}]`),
      chalk.green(message),
      data ? chalk.gray(JSON.stringify(data, null, 2)) : ''
    );
  }

  warn(message: string, data?: any) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(
      chalk.blue(`[${timestamp}]`),
      chalk.yellow(`⚠ [${this.context}]`),
      chalk.yellow(message),
      data ? chalk.gray(JSON.stringify(data, null, 2)) : ''
    );
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(
      chalk.blue(`[${timestamp}]`),
      chalk.red(`✗ [${this.context}]`),
      chalk.red(message),
      error ? chalk.red(error.message || error) : ''
    );
  }

  functionCall(name: string, args: any) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(
      chalk.blue(`[${timestamp}]`),
      chalk.magenta(`🔧 [FUNCTION CALL]`),
      chalk.bold(name),
      chalk.dim(JSON.stringify(args))
    );
  }

  apiCall(service: string, endpoint: string) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(
      chalk.blue(`[${timestamp}]`),
      chalk.cyan(`🌐 [API]`),
      chalk.cyan(service),
      chalk.dim(`→ ${endpoint}`)
    );
  }

  result(message: string, count?: number) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const countStr = count !== undefined ? chalk.bold(`(${count} items)`) : '';
    console.log(
      chalk.blue(`[${timestamp}]`),
      chalk.green(`📊 [RESULT]`),
      message,
      countStr
    );
  }

  separator() {
    console.log(chalk.gray('─'.repeat(80)));
  }

  header(message: string) {
    console.log(chalk.bold.white(`\n━━━ ${message} ━━━`));
  }
}
