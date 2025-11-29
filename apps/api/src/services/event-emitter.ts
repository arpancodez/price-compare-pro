export type EventHandler = (...args: any[]) => void | Promise<void>;

export class EventEmitter {
  private listeners: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
    return this;
  }

  off(event: string, handler: EventHandler): this {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
    return this;
  }

  async emit(event: string, ...args: any[]): Promise<void> {
    const handlers = this.listeners.get(event) || [];
    for (const handler of handlers) {
      await handler(...args);
    }
  }

  once(event: string, handler: EventHandler): this {
    const wrapper: EventHandler = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}
