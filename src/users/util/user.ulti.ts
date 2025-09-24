import * as bcrypt from 'bcrypt';

export async function hashPass(plainPassword: string): Promise<string> {
	const saltRounds = 10;
	const salt = await bcrypt.genSalt(saltRounds);
	return bcrypt.hash(plainPassword, salt);
}

export async function comparePass(
	plainPassword: string,
	hashedPassword: string,
): Promise<boolean> {
	return bcrypt.compare(plainPassword, hashedPassword);
}
