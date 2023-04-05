import { Request } from 'express';

interface AuthenticatedRequest extends Request {
    user?: User;
}

type AccountType = "student" | "teacher" | "admin";

interface User {
    /**
     * The id of the User
     */
    id: number;
    /**
     * The username of the User used to log in
     */
    username: string;

    /**
     * Type of the account
     */
    type: AccountType;

    /**
     * Password hash (bcrypt)
     */
    password: string;

}

interface Student extends User {
    type: "student";
    /**
     * The Grade of the User, 5-10, E: 11, Q2: 12
     */
    grade: number;
    class: string;
    /**
     * The id of the project the User got assigned to
     */
    assignedProject?: string;

    /**
    * A list of project Ids in order they were wished by the student
    */
    wishes?: string[];

}

interface Teacher extends User {
    type: "teacher" | "admin";

    managedProject: string;

    managedClass: string;

}

interface Admin extends Teacher {
    isAdmin: true;
}

export { User, Admin, Teacher, Student, AuthenticatedRequest };