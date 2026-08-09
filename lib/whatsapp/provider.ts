export type WhatsAppDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface WhatsAppSendOptions {
  onStatus?: (status: WhatsAppDeliveryStatus) => void;
  onError?: (error: unknown) => void;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  sentAt?: string;
  error?: unknown;
}

export interface WhatsAppProvider {
  readonly id: string;
  readonly name: string;
  sendMessage(phone: string, message: string, options?: WhatsAppSendOptions): Promise<WhatsAppSendResult>;
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export class SimulatorProvider implements WhatsAppProvider {
  readonly id = 'simulator';
  readonly name = 'Simulação (sem API real)';
  private counter = 0;

  async sendMessage(phone: string, message: string, options?: WhatsAppSendOptions): Promise<WhatsAppSendResult> {
    const messageId = `sim_${Date.now()}_${++this.counter}`;
    const sentAt = new Date().toISOString();
    options?.onStatus?.('sent');
    await delay(2000);
    options?.onStatus?.('delivered');
    await delay(3000);
    options?.onStatus?.('read');
    return { success: true, messageId, sentAt };
  }
}

let activeProvider: WhatsAppProvider | null = null;

export const getWhatsAppProvider = (): WhatsAppProvider => {
  if (!activeProvider) activeProvider = new SimulatorProvider();
  return activeProvider;
};

export const setWhatsAppProvider = (provider: WhatsAppProvider): void => {
  activeProvider = provider;
};