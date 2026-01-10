export const isDefined = <T>(value: T | undefined | null): value is T => {
	const isNull = () => value === null;
	const isUndefined = () => value === undefined;

	return !isNull() && !isUndefined();
};
