import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights into your productivity patterns and time management.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Focus Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28h 15m</div>
              <p className="text-xs text-muted-foreground">
                +2h 30m from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">
                Above average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deep Work Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +3 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2h 21m</div>
              <p className="text-xs text-muted-foreground">
                +15m from last week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Focus Time Distribution</CardTitle>
              <CardDescription>
                How you spend your focused work time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Chart component will be implemented here</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Energy Levels</CardTitle>
              <CardDescription>
                Your energy patterns throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Energy chart will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
            <CardDescription>
              Your productivity trends over the past 4 weeks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-muted/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Trends chart will be implemented here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
