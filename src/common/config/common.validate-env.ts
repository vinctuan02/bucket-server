import * as Joi from 'joi';

export const validationSchema = Joi.object({
	DB_HOST: Joi.string().hostname().required(),
	DB_PORT: Joi.number().port().default(5432).required(),
	DB_USER: Joi.string().required(),
	DB_PASS: Joi.string().allow('').required(),
	DB_NAME: Joi.string().required(),
});
