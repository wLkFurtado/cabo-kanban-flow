import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { List, Kanban, Calendar, FileText, BarChart3 } from "lucide-react";

interface ViewTabsProps {
  children: React.ReactNode;
}

export function ViewTabs({ children }: ViewTabsProps) {
  return (
    <Tabs defaultValue="board" className="w-full">
      <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5 mb-6">
        <TabsTrigger value="list" className="flex items-center gap-2">
          <List size={16} />
          <span className="hidden sm:inline">List</span>
        </TabsTrigger>
        <TabsTrigger value="board" className="flex items-center gap-2">
          <Kanban size={16} />
          <span className="hidden sm:inline">Board</span>
        </TabsTrigger>
        <TabsTrigger value="schedule" className="flex items-center gap-2">
          <Calendar size={16} />
          <span className="hidden sm:inline">Schedule</span>
        </TabsTrigger>
        <TabsTrigger value="files" className="flex items-center gap-2">
          <FileText size={16} />
          <span className="hidden sm:inline">Files</span>
        </TabsTrigger>
        <TabsTrigger value="report" className="flex items-center gap-2">
          <BarChart3 size={16} />
          <span className="hidden sm:inline">Report</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="mt-0">
        <div className="text-center py-8 text-muted-foreground">
          <List size={48} className="mx-auto mb-4 opacity-50" />
          <p>Vista de lista em desenvolvimento</p>
        </div>
      </TabsContent>

      <TabsContent value="board" className="mt-0">
        {children}
      </TabsContent>

      <TabsContent value="schedule" className="mt-0">
        <div className="text-center py-8 text-muted-foreground">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>Vista de cronograma em desenvolvimento</p>
        </div>
      </TabsContent>

      <TabsContent value="files" className="mt-0">
        <div className="text-center py-8 text-muted-foreground">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Vista de arquivos em desenvolvimento</p>
        </div>
      </TabsContent>

      <TabsContent value="report" className="mt-0">
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Vista de relatórios em desenvolvimento</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}