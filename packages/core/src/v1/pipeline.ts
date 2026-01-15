import { isInitialized } from './config';

export type Operation = {
  name: string;
  params: Record<string, unknown>;
};

export abstract class Pipeline<TData, TResult> {
  protected type: string;
  protected data: TData;
  protected ops: Operation[];
  protected executor: (data: TData, ops: Operation[]) => Promise<TResult>;

  constructor(
    type: string,
    data: TData,
    ops: Operation[],
    executor: (data: TData, ops: Operation[]) => Promise<TResult>
  ) {
    this.type = type;
    this.data = data;
    this.ops = ops;
    this.executor = executor;
  }

  protected add(name: string, params: Record<string, unknown>): Pipeline<TData, TResult> {
    return new (this.constructor as new (data: TData, ops: Operation[]) => Pipeline<TData, TResult>)(
      this.data,
      [...this.ops, { name, params }]
    );
  }

  async run(): Promise<TResult> {

    if (!isInitialized()) {
      throw new Error('[RobinWood] Not initialized. Call steal.init({ apiKey }) first.');
    }
    
    return this.executor(this.data, this.ops);
  }
}

