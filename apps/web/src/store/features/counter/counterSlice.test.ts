import type { AppStore } from "../../store";
import { makeStore } from "../../store";
import type { CounterSliceState } from "./counterSlice";
import {
	counterSlice,
	decrement,
	increment,
	incrementByAmount,
	selectCount,
} from "./counterSlice";

type LocalTestContext = {
	store: AppStore;
};

describe("counter reducer", () => {
	beforeEach<LocalTestContext>((context: LocalTestContext) => {
		const initialState: CounterSliceState = {
			value: 3,
			status: "idle",
		};

		const store = makeStore({ counter: initialState });

		context.store = store;
	});

	it("should handle initial state", () => {
		expect(counterSlice.reducer(undefined, { type: "unknown" })).toStrictEqual({
			value: 0,
			status: "idle",
		});
	});

	it<LocalTestContext>("should handle increment", ({
		store,
	}: LocalTestContext) => {
		expect(selectCount(store.getState())).toBe(3);

		store.dispatch(increment());

		expect(selectCount(store.getState())).toBe(4);
	});

	it<LocalTestContext>("should handle decrement", ({
		store,
	}: LocalTestContext) => {
		expect(selectCount(store.getState())).toBe(3);

		store.dispatch(decrement());

		expect(selectCount(store.getState())).toBe(2);
	});

	it<LocalTestContext>("should handle incrementByAmount", ({
		store,
	}: LocalTestContext) => {
		expect(selectCount(store.getState())).toBe(3);

		store.dispatch(incrementByAmount(2));

		expect(selectCount(store.getState())).toBe(5);
	});
});
