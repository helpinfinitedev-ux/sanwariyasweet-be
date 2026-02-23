import jwt from "jsonwebtoken";
import { IUser } from "../../models/user.model";

const signToken = (userData: IUser) => {
  return jwt.sign(
    {
      id: userData._id?.toString(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      emailAddress: userData.emailAddress,
      role: userData.role,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "72h" }
  ) as string;
};

const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as IUser;
};

export { signToken, verifyToken };
