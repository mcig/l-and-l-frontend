import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AngluinLearning from "@/components/AngluinLearning";
import AngluinDemo from "@/components/AngluinDemo";
import FunFeatures from "@/components/FunFeatures";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, RefreshCw, BookOpen, FlaskConical, Trophy } from "lucide-react";

function App() {
  const refreshData = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 text-foreground flex flex-col">
      <header className="border-b bg-white/90 backdrop-blur-sm p-4 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                Angluin's Method: Interactive Schema Learning
              </h1>
              <p className="text-sm text-muted-foreground">
                Learn schema mappings through interactive examples
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={refreshData}
            className="flex items-center space-x-2 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6 flex-1">
        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/80 backdrop-blur-sm border border-gray-200">
            <TabsTrigger
              value="demo"
              className="flex items-center space-x-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700"
            >
              <BookOpen className="h-4 w-4" />
              <span>Interactive Demo</span>
            </TabsTrigger>
            <TabsTrigger
              value="learning"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <FlaskConical className="h-4 w-4" />
              <span>Learning Sessions</span>
            </TabsTrigger>
            <TabsTrigger
              value="fun"
              className="flex items-center space-x-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              <Trophy className="h-4 w-4" />
              <span>Fun Features</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)] rounded-lg border bg-white/80 backdrop-blur-sm">
            <div className="max-w-[1200px] mx-auto">
              <TabsContent value="demo" className="p-6">
                <AngluinDemo />
              </TabsContent>

              <TabsContent value="learning" className="p-6">
                <AngluinLearning />
              </TabsContent>

              <TabsContent value="fun" className="p-6">
                <FunFeatures />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </main>

      <footer className="border-t bg-white/90 backdrop-blur-sm p-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center space-x-2">
          <span>Interactive Schema Learning with Angluin's Method</span>
          <span>•</span>
          <span>Based on L&L research paper</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
