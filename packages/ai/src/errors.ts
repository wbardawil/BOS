// @bos/ai — typed flow errors. Callers branch on instanceof, never on message text.

export class FlowAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlowAuthError";
  }
}

export class FlowGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlowGateError";
  }
}

export class FlowInputError extends Error {
  constructor(
    message: string,
    public readonly issues: unknown,
  ) {
    super(message);
    this.name = "FlowInputError";
  }
}

export class FlowOutputParseError extends Error {
  constructor(
    message: string,
    public readonly rawText: string,
  ) {
    super(message);
    this.name = "FlowOutputParseError";
  }
}

export class FlowGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlowGuardError";
  }
}

export class CostCapExceededError extends Error {
  constructor(
    public readonly orgId: string,
    public readonly spentCents: number,
    public readonly capCents: number,
  ) {
    super(
      `@bos/ai: org ${orgId} has spent ${spentCents}¢ of its ${capCents}¢ monthly cap — call refused`,
    );
    this.name = "CostCapExceededError";
  }
}

export class ModelRefusalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelRefusalError";
  }
}
