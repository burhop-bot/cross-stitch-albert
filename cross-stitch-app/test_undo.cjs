const { create } = require('./node_modules/zustand');

// Simulate minimal persist middleware
const createPersistedStore = (fn, options) => {
  let initialState = fn(() => {}, () => {});
  return create((set, get) => ({
    ...initialState,
    ...fn(
      (state) => { set(state); return state; },
      get
    )
  }));
};

let undoBeforeChange = false;
let pendingSnapshot = null;
let inUndoRedo = false;

const store = create((set, get) => ({
  data: 'initial',
  undoStack: [],
  redoStack: [],
  update: (data) => {
    pendingSnapshot = get();
    undoBeforeChange = true;
    set({ data });
  },
  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const undoStack = [...state.undoStack];
    const prev = undoStack[undoStack.length - 1];
    undoStack.pop();
    inUndoRedo = true;
    set(prev);
    set({ undoStack, redoStack: [...state.redoStack, prev] });
    inUndoRedo = false;
  },
  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const redoStack = [...state.redoStack];
    const next = redoStack[redoStack.length - 1];
    redoStack.pop();
    inUndoRedo = true;
    set(next);
    set({ undoStack: [...state.undoStack, next], redoStack });
    inUndoRedo = false;
  },
}));

store.subscribe((state) => {
  if (inUndoRedo) return;
  if (!undoBeforeChange) return;
  undoBeforeChange = false;
  
  const raw = pendingSnapshot || state;
  pendingSnapshot = null;
  
  if (raw.undoStack !== undefined && raw.undoStack !== null) {
    const newStack = [...raw.undoStack, raw].slice(-50);
    store.setState({ undoStack: newStack, redoStack: [] });
  }
});

console.log('Initial:', store.getState());
console.log('undoStack length:', store.getState().undoStack.length);

store.getState().update('changed');
console.log('After update:', store.getState().data);
console.log('undoStack length:', store.getState().undoStack.length);
console.log('undoStack[0].data:', store.getState().undoStack[0]?.data);

store.getState().undo();
console.log('After undo:', store.getState().data);
console.log('undoStack length:', store.getState().undoStack.length);
console.log('redoStack length:', store.getState().redoStack.length);

store.getState().redo();
console.log('After redo:', store.getState().data);
console.log('undoStack length:', store.getState().undoStack.length);
console.log('redoStack length:', store.getState().redoStack.length);
