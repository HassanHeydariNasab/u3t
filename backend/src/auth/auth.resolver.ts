import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput, RegisterInput, AuthResponse } from './dto/auth.dto';
import { User } from '../users/user.entity';
import { GqlAuthGuard } from './guards/gql-auth.guard';

@Resolver(() => User)
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(
    @Args('loginInput', new ValidationPipe()) loginInput: LoginInput,
  ): Promise<AuthResponse> {
    return this.authService.login(loginInput);
  }

  @Mutation(() => AuthResponse)
  async register(
    @Args('registerInput', new ValidationPipe()) registerInput: RegisterInput,
  ): Promise<AuthResponse> {
    return this.authService.register(registerInput);
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async profile(@Context('req') req: any): Promise<User> {
    return req.user;
  }
}
