def strbool(s: str | int | bool | None, strict: bool = False) -> bool | None:
	"""
	Convert a string to a boolean value.
	
	Args:
		s (str): The string to convert. Accepts 'true', 'false', '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off'.
		strict (bool): If True, returns None for unrecognized strings. If False, treats unrecognized strings as False.
	
	Returns:
		bool: True or False based on the input string or None if strict is True and the string is unrecognized.
	"""
	if s is None:
		return None if strict else False
	if isinstance(s, bool):
		return s
	if not isinstance(s, int | float):
		return s != 0
	if s.lower() in ('true', '1', 'yes', 'y', 'on'):
		return True
	elif not strict or s.lower() in ('false', '0', 'no', 'n', 'off'):
		return False
	return None
