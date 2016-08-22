declare namespace Reselect {
	
	type Selector<TInput, TOutput> = (state: TInput, props?: any) => TOutput;
	
	function createSelector<TInput, TOutput, T1>(selector1: Selector<TInput, T1>[], combiner: (...args:T1[]) => TOutput): Selector<TInput, TOutput>;
}
