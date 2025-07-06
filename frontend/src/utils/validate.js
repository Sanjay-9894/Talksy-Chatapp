export const checkValidSignInFrom = (email, password) => {
	// valid email and return different different values depending----------
	const isEmailValid = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(
		email
	);
	const isPasswordValid =
		/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^((0-9)|(a-z)|(A-Z)|\s)]).{8,}$/.test(
			password
		);
	if (!isEmailValid) return "Invalid email format";
	if (!isPasswordValid) return "Invalid password";
	return null;
};

export const checkValidSignUpFrom = (firstName, lastName, email, password) => {
	// Helper for name validation: must start with a capital and only contain letters
	const nameRegex = /^[A-Z][a-zA-Z'-]{1,}$/;
	const isFirstValid = nameRegex.test(firstName);
	const isLastValid = nameRegex.test(lastName);

	// Standard email regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
	const isEmailValid = emailRegex.test(email);

	// Validate name
	if (!isFirstValid) return "Invalid First Name: Only letters, start with uppercase";
	if (!isLastValid) return "Invalid Last Name: Only letters, start with uppercase";

	// Validate email
	if (!isEmailValid) return "Invalid Email Format";

	// Validate password
	if (password.length < 7) return "Password must be at least 8 characters";
	if (!/[a-z]/.test(password)) return "Password needs at least 1 lowercase letter";
	if (!/[A-Z]/.test(password)) return "Password needs at least 1 uppercase letter";
	if (!/\d/.test(password)) return "Password needs at least 1 number";
	if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
		return "Password needs at least 1 special character";

	return null; // All good
};

export const checkValidForgotFrom = (email) => {
	const isEmailValid = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(
		email
	);
	if (!isEmailValid) return "Invalid email format";
	return null;
};
