import type { PayloadAction } from '@reduxjs/toolkit';
import { createAppSlice } from '../../createAppSlice';
import type { AppThunk } from '../../store';
import { fetchCount } from './counterAPI';

export type CounterSliceState = {
  value: number;
  status: 'idle' | 'loading' | 'failed';
};

const initialState: CounterSliceState = {
  status: 'idle',
  value: 0,
};

// If you are not using async thunks you can use the standalone `createSlice`.
export const counterSlice = createAppSlice({
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  name: 'counter',
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: (create) => ({
    decrement: create.reducer((state) => {
      state.value -= 1;
    }),
    increment: create.reducer((state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    }),
    // The function below is called a thunk and allows us to perform async logic. It
    // can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
    // will call the thunk with the `dispatch` function as the first argument. Async
    // code can then be executed and other actions can be dispatched. Thunks are
    // typically used to make async requests.
    incrementAsync: create.asyncThunk(
      async (amount: number) => {
        const response = await fetchCount(amount);
        // The value we return becomes the `fulfilled` action payload
        return response.data;
      },
      {
        fulfilled: (state, action) => {
          state.status = 'idle';
          state.value += action.payload;
        },
        pending: (state) => {
          state.status = 'loading';
        },
        rejected: (state) => {
          state.status = 'failed';
        },
      },
    ),
    // Use the `PayloadAction` type to declare the contents of `action.payload`
    incrementByAmount: create.reducer(
      (state, action: PayloadAction<number>) => {
        state.value += action.payload;
      },
    ),
  }),
  // You can define your selectors here. These selectors receive the slice
  // state as their first argument.
  selectors: {
    selectCount: (counter) => counter.value,
    selectStatus: (counter) => counter.status,
  },
});

// Action creators are generated for each case reducer function.
export const { decrement, increment, incrementByAmount, incrementAsync } =
  counterSlice.actions;

// Selectors returned by `slice.selectors` take the root state as their first argument.
export const { selectCount, selectStatus } = counterSlice.selectors;

// We can also write thunks by hand, which may contain both sync and async logic.
// Here's an example of conditionally dispatching actions based on current state.
export const incrementIfOdd =
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const currentValue = selectCount(getState());

    if (currentValue % 2 === 1 || currentValue % 2 === -1) {
      dispatch(incrementByAmount(amount));
    }
  };
