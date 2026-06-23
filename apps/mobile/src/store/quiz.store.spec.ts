import { useQuizStore } from './quiz.store';

describe('quiz store', () => {
  afterEach(() => useQuizStore.getState().reset());

  it('keeps answers keyed by question id and resets them', () => {
    useQuizStore.getState().start([{ id: 'q1', prompt: 'question', choices: ['a', 'b'] }], 'SECOND_NORMAL', 'QUICK');
    useQuizStore.getState().answer('q1', 1);
    expect(useQuizStore.getState().answers).toEqual({ q1: 1 });
    expect(useQuizStore.getState().startedAt).toEqual(expect.any(Number));
    useQuizStore.getState().reset();
    expect(useQuizStore.getState().questions).toHaveLength(0);
    expect(useQuizStore.getState().answers).toEqual({});
  });
});
