import { Request } from 'express';

interface AuthenticatedRequest extends Request {
    user?: User;
}

type AccountType = "student" | "teacher";

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

    /**
     * Full name
     */
    fullName: string;

    /**
     * Determines if a password change is required on next login
     */
    changePasswordRequired: boolean;
    /**
     * Whether the user is an admin
     */
    admin: boolean;
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
    assignedProject?: number;

    /**
    * A list of project Ids in order they were wished by the student
    */
    wishes?: number[];

}

interface Teacher extends User {
    type: "teacher";

    managedProject: number;

    managedClass: number;

}

function isStudent( user: User): user is Student {
    return user.type === "student";
};
function isTeacher( user: User): user is Teacher {
    return user.type === "teacher";
};

export { User, Teacher, Student, AuthenticatedRequest, isStudent, isTeacher, AccountType };
