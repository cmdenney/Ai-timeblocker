import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            AI TimeBlocker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Intelligent time blocking and calendar management powered by AI. 
            Optimize your schedule, boost productivity, and achieve your goals.
          </p>
        </div>

        <div className="flex gap-4">
          <Button size="lg" className="px-8">
            Get Started
          </Button>
          <Button variant="outline" size="lg" className="px-8">
            Learn More
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Smart Scheduling</CardTitle>
              <CardDescription>
                AI-powered time blocking that adapts to your work patterns and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically optimize your calendar based on your energy levels, 
                deadlines, and personal preferences.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>
                Seamlessly sync with Google Calendar, Outlook, and other popular platforms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Keep all your calendars in sync while maintaining the flexibility 
                to work with your existing tools.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Track your productivity patterns and get actionable insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Understand how you spend your time and identify opportunities 
                for improvement with detailed analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
