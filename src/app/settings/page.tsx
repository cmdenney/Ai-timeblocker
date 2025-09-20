import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and account settings.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>
                Basic settings for your time blocking experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <select className="w-full p-2 border rounded-md">
                  <option>UTC-8 (Pacific Time)</option>
                  <option>UTC-5 (Eastern Time)</option>
                  <option>UTC+0 (GMT)</option>
                  <option>UTC+1 (Central European Time)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Working Hours</label>
                <div className="flex space-x-2">
                  <input 
                    type="time" 
                    defaultValue="09:00" 
                    className="flex-1 p-2 border rounded-md"
                  />
                  <span className="flex items-center">to</span>
                  <input 
                    type="time" 
                    defaultValue="17:00" 
                    className="flex-1 p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Break Duration (minutes)</label>
                <input 
                  type="number" 
                  defaultValue="15" 
                  min="5" 
                  max="60" 
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>
                Connect your external calendars
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded"></div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded"></div>
                  <div>
                    <p className="font-medium">Microsoft Outlook</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-500 rounded"></div>
                  <div>
                    <p className="font-medium">Apple Calendar</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Browser notifications</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Break Reminders</p>
                  <p className="text-sm text-muted-foreground">Remind me to take breaks</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Meeting Alerts</p>
                  <p className="text-sm text-muted-foreground">Alert before meetings</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Preferences</CardTitle>
              <CardDescription>
                Customize AI behavior and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Optimization Level</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Conservative</option>
                  <option>Balanced</option>
                  <option>Aggressive</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-schedule Breaks</p>
                  <p className="text-sm text-muted-foreground">Let AI schedule your breaks</p>
                </div>
                <input type="checkbox" className="w-4 h-4" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Energy-based Scheduling</p>
                  <p className="text-sm text-muted-foreground">Schedule based on energy levels</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Conflict Resolution</p>
                  <p className="text-sm text-muted-foreground">Auto-resolve scheduling conflicts</p>
                </div>
                <input type="checkbox" className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
