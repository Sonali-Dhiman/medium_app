import { Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signinInput, signupInput } from "@sonalidhiman/medium-comman-ver-1"

export const userRouter = new Hono<{
    Bindings:{
      DATABASE_URL:string
      JWT_SECRET:string
    }
  }>()

userRouter.post('/signup', async(c)=>{
  console.log("!1111111111111111inside")
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())  //connecting connectio pool through prisma accelerate
  
  const body = await c.req.json(); //getting body
  console.log("!1111111111111111",body)
  //sanitize body
  const {success} = signupInput.safeParse(body);
  console.log("!1111111111111111",success)
  if(!success){
    c.status(400); // Changing 411 to 400 for a bad request
    return c.json({
      message: "Inputs are incorrect"
    });
  }
  const user = await prisma.user.create({
    data:{
      email: body.email,
      password: body.password,
    }
  })
  
  const token = await sign({id: user.id},c.env.JWT_SECRET)
    return c.json({
      jwt:token
    })
  })
  
  userRouter.post('/signin',async(c)=>{
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  const body = await c.req.json()
  const {success} = signinInput.safeParse(body);
  if(!success){
    c.status(400); // Changing 411 to 400 for a bad request
    return c.json({
      message: "Inputs are incorrect"
    });
  }
  const user = await prisma.user.findUnique({
    where:{
      email:body.email,
      password:body.password
    }
  })
  
  if(!user){
    c.status(403);
    return c.json({error:"User not found"})
  }
  
  const jwt = await sign({id: user.id},c.env.JWT_SECRET);
    return c.json({jwt})
  })