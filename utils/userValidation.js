import { userSchema } from './userSchema.js';

export function validateNewUSer(user) {
  for (const property of Object.keys(userSchema)) {
    if (!user.hasOwnProperty(property) || !user[property] ) {
      return { valid: false, message:`missing ${property} field` };
    }
  }
  return { valid: true };
}