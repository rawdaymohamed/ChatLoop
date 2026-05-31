import { Button } from "@/components/ui/button"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

const Home = () => {
  const { user } = useAuth()

  if (user) return <Navigate to="/user/conversations" replace />

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-center space-y-8">
        {/* title */}
        <div className="text-center">
          <h1 className="text-6xl font-bold lg:text-8xl">ChatLoop</h1>
          <p className="text-xl">Online Chatting App</p>
        </div>
        {/* action buttons */}
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button
              className="p-4 text-base lg:p-6 lg:text-xl"
              size={"lg"}
              variant={"secondary"}
            >
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button
              size={"lg"}
              className="bg-primary/90 p-4 text-base hover:bg-primary lg:p-6 lg:text-xl"
            >
              Signup
            </Button>
          </Link>
        </div>
      </div>
      {/* footer */}
      <div className="p-6">
        <p className="text text-center text-sm text-muted-foreground lg:text-base">
          © {new Date().getFullYear()} ChatLoop. All rights reserved.{" "}
        </p>
      </div>
    </div>
  )
}

export default Home
