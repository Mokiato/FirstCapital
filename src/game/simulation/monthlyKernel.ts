export interface MonthlyProcessor<State> {
  id: string;
  order: number;
  run: (state: State, completedMonth: number) => State;
}

export function processCompletedMonths<State>(
  initialState: State,
  completedMonths: number[],
  processors: MonthlyProcessor<State>[],
): State {
  const orderedProcessors = [...processors].sort(
    (a, b) => a.order - b.order,
  );

  let state = initialState;

  for (const month of completedMonths) {
    for (const processor of orderedProcessors) {
      state = processor.run(state, month);
    }
  }

  return state;
}