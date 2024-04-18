export type QueueStateResponse = {
  totalInQueue: number;
  currentInQueue: number;
  queueState: { window: number; ticket: number }[];
};

export type ProcessNextTicketResponse = {
  message: string;
  currentInQueue?: number;
};

export type RequestNewTicketResponse = {
  message: string;
  data: {
    nextQueueNumber: number;
    EtaMS?: number;
    EtaTime?: Date;
  };
};

export interface ServerToClientEvents {
  queueUpdated: (payload: QueueStateResponse) => void;
}
