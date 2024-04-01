export type QueueStateResponse = {
  totalInQueue: number;
  currentInQueue: number;
  queueState: { window: number; ticket: number }[];
};

export interface ServerToClientEvents {
  queueUpdated: (payload: QueueStateResponse) => void;
}
