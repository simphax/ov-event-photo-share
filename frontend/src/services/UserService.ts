import { v4 as uuidv4 } from 'uuid';

export const getUserId = (): string => {
    if(!localStorage.getItem('userId')) {
        localStorage.setItem('userId', uuidv4());
    }
    return localStorage.getItem('userId')!;
};