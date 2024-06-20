import { Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify} from 'hono/jwt'
import { createBlogInput, updateBlogInput } from "@sonalidhiman/medium-comman-ver-1"
export const blogRouter = new Hono<{
    Bindings:{
        DATABASE_URL:string
        JWT_SECRET:string
    },
    Variables:{
      userId:string
    }
}>()

blogRouter.use('/*', async(c,next)=>{
    const header:string | undefined= c.req.header("authorization" || "")
    const token = header?.split(" ")[1] //expecting it has bearer as prefix in token
    try{
      const user = await verify(token || "", c.env.JWT_SECRET)
      if(user){
        c.set("userId", user.id as string)
        await next()
      } else{
        c.status(403);
        c.json({error:"unauthorized"})
      } 
   }catch(e){
      c.status(403);
      return c.json({
        message:"You are not logged in"
      })
    }
  })
  
blogRouter.post('/', async(c)=>{
    const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json();
    const {success} = createBlogInput.safeParse(body);
    if(!success){
      c.status(400); // Changing 411 to 400 for a bad request
      return c.json({
        message: "Inputs are incorrect"
      });
    }
    const userId = c.get("userId");
    const blog = await prisma.post.create({
      data:{
        title:body.title,
        content:body.content,
        authorId: userId
      }
    })

    return c.json({
      id: blog.id
    })
  })
  blogRouter.put('/', async(c)=>{
    const body = await c.req.json()
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
      const {success} = updateBlogInput.safeParse(body);
      if(!success){
        c.status(400); // Changing 411 to 400 for a bad request
        return c.json({
          message: "Inputs are incorrect"
        });
      }
      const blog = await prisma.post.update({
        where:{
          id: body.id
        },
        data:{
          title:body.title,
          content:body.content
        }
      })
    return c.json({
      id:blog.id
    })
  })

  blogRouter.get('/bulk', async(c)=>{
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
    
    const blogs = await prisma.post.findMany();

    return c.json({
      blogs
    })
  }) 

  blogRouter.get('/:id', async(c)=>{
    const id =  c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
      
      try{
        const blog = await prisma.post.findFirst({
          where:{
            id:id
          }
        })
      return c.json({
        blog
      })
    }catch(e){
      c.status(411);
      return c.json({
        message:"Error fetching blog post"
      })
    }
  })


  
  

  