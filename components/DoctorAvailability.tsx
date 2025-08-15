import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Calendar, Save, RotateCcw, CalendarDays } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { format } from "date-fns";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DayAvailability {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface DateSpecificAvailability {
  date: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const TIME_SLOTS: TimeSlot[] = [
  { startTime: "08:00", endTime: "09:00" },
  { startTime: "09:00", endTime: "10:00" },
  { startTime: "10:00", endTime: "11:00" },
  { startTime: "11:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "13:00" },
  { startTime: "13:00", endTime: "14:00" },
  { startTime: "14:00", endTime: "15:00" },
  { startTime: "15:00", endTime: "16:00" },
  { startTime: "16:00", endTime: "17:00" },
  { startTime: "17:00", endTime: "18:00" },
];

const DoctorAvailability = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const doctorId = 1; // In a real app, this would come from auth context

  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [dateSpecificAvailability, setDateSpecificAvailability] = useState<DateSpecificAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  // Fetch current availability
  const { data: currentAvailability, isLoading } = useQuery({
    queryKey: [`/api/doctor/${doctorId}/availability`],
    initialData: [],
  });

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (newAvailability: DayAvailability[]) => {
      const response = await fetch(`/api/doctor/${doctorId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAvailability.map(avail => ({
          doctorId,
          dayOfWeek: avail.dayOfWeek,
          startTime: avail.startTime,
          endTime: avail.endTime,
          isAvailable: avail.isAvailable
        })))
      });
      
      if (!response.ok) {
        throw new Error('Failed to update availability');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/doctor/${doctorId}/availability`] });
      toast({
        title: "Success",
        description: "Your availability has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize availability state
  useEffect(() => {
    if (currentAvailability && currentAvailability.length > 0) {
      setAvailability(currentAvailability);
    } else {
      // Initialize with default availability (9 AM - 5 PM, Monday to Friday)
      const defaultAvailability: DayAvailability[] = DAYS_OF_WEEK.map((_, index) => ({
        dayOfWeek: index,
        isAvailable: index >= 1 && index <= 5, // Monday to Friday
        startTime: "09:00",
        endTime: "17:00"
      }));
      setAvailability(defaultAvailability);
    }
  }, [currentAvailability]);

  const handleAvailabilityToggle = (dayIndex: number, isAvailable: boolean) => {
    setAvailability(prev => 
      prev.map((day, index) => 
        index === dayIndex ? { ...day, isAvailable } : day
      )
    );
  };

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => 
      prev.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSave = () => {
    updateAvailabilityMutation.mutate(availability);
  };

  const handleReset = () => {
    if (currentAvailability && currentAvailability.length > 0) {
      setAvailability(currentAvailability);
    }
  };

  // Date-specific availability handlers
  const addDateSpecificAvailability = () => {
    if (!selectedDate) return;
    
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const existingIndex = dateSpecificAvailability.findIndex(item => item.date === dateString);
    
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...dateSpecificAvailability];
      updated[existingIndex] = {
        date: dateString,
        isAvailable: true,
        startTime: "09:00",
        endTime: "17:00"
      };
      setDateSpecificAvailability(updated);
    } else {
      // Add new
      setDateSpecificAvailability(prev => [...prev, {
        date: dateString,
        isAvailable: true,
        startTime: "09:00",
        endTime: "17:00"
      }]);
    }
    setDatePopoverOpen(false);
  };

  const updateDateSpecificAvailability = (date: string, field: keyof DateSpecificAvailability, value: any) => {
    setDateSpecificAvailability(prev => 
      prev.map(item => 
        item.date === date ? { ...item, [field]: value } : item
      )
    );
  };

  const removeDateSpecificAvailability = (date: string) => {
    setDateSpecificAvailability(prev => prev.filter(item => item.date !== date));
  };

  const getCurrentDateAvailability = (date: string) => {
    return dateSpecificAvailability.find(item => item.date === date);
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Availability Management
        </CardTitle>
        <CardDescription>
          Manage your weekly schedule and specific date overrides
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Weekly Schedule</span>
              <span className="sm:hidden">Weekly</span>
            </TabsTrigger>
            <TabsTrigger value="dates" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Specific Dates</span>
              <span className="sm:hidden">Dates</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Set your regular weekly availability pattern</span>
              </div>
              
              {availability.map((day, index) => (
          <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-20 flex-shrink-0">
                <Badge variant={day.isAvailable ? "default" : "secondary"} className="text-xs">
                  {DAYS_OF_WEEK[index]}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={day.isAvailable}
                  onCheckedChange={(checked) => handleAvailabilityToggle(index, checked)}
                />
                <Label className="text-sm">
                  {day.isAvailable ? "Available" : "Unavailable"}
                </Label>
              </div>
            </div>
            
            {day.isAvailable && (
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 ml-24 sm:ml-0">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm whitespace-nowrap">From:</Label>
                  <select
                    value={day.startTime}
                    onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                    className="px-2 py-1 border rounded text-sm min-w-0 flex-1"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.startTime} value={slot.startTime}>
                        {slot.startTime}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label className="text-sm whitespace-nowrap">To:</Label>
                  <select
                    value={day.endTime}
                    onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                    className="px-2 py-1 border rounded text-sm min-w-0 flex-1"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.endTime} value={slot.endTime}>
                        {slot.endTime}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
                )}
              </div>
            ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={updateAvailabilityMutation.isPending}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateAvailabilityMutation.isPending}
                className="bg-primary hover:bg-primary-dark w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Save Weekly Schedule</span>
                <span className="sm:hidden">Save Schedule</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="dates" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Override availability for specific dates</span>
                  <span className="sm:hidden">Date overrides</span>
                </div>
                
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Date Override</span>
                      <span className="sm:hidden">Add Override</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Button 
                        onClick={addDateSpecificAvailability}
                        className="w-full"
                        size="sm"
                        disabled={!selectedDate}
                      >
                        Add Override for {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Selected Date'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {dateSpecificAvailability.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No date-specific overrides set</p>
                  <p className="text-sm">Add specific dates to override your weekly schedule</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dateSpecificAvailability
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((dateAvail) => (
                      <div key={dateAvail.date} className="flex flex-col space-y-4 p-4 border rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-4">
                            <div className="w-32 flex-shrink-0">
                              <Badge variant="outline" className="text-sm">
                                {format(new Date(dateAvail.date), 'MMM d, yyyy')}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(dateAvail.date), 'EEEE')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={dateAvail.isAvailable}
                                onCheckedChange={(checked) => 
                                  updateDateSpecificAvailability(dateAvail.date, 'isAvailable', checked)
                                }
                              />
                              <Label className="text-sm">
                                {dateAvail.isAvailable ? "Available" : "Unavailable"}
                              </Label>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDateSpecificAvailability(dateAvail.date)}
                            className="text-destructive hover:text-destructive self-start sm:self-center"
                          >
                            Remove
                          </Button>
                        </div>
                        
                        {dateAvail.isAvailable && (
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 ml-0 sm:ml-36">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <Label className="text-sm whitespace-nowrap">From:</Label>
                              <select
                                value={dateAvail.startTime}
                                onChange={(e) => 
                                  updateDateSpecificAvailability(dateAvail.date, 'startTime', e.target.value)
                                }
                                className="px-2 py-1 border rounded text-sm min-w-0 flex-1"
                              >
                                {TIME_SLOTS.map((slot) => (
                                  <option key={slot.startTime} value={slot.startTime}>
                                    {slot.startTime}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm whitespace-nowrap">To:</Label>
                              <select
                                value={dateAvail.endTime}
                                onChange={(e) => 
                                  updateDateSpecificAvailability(dateAvail.date, 'endTime', e.target.value)
                                }
                                className="px-2 py-1 border rounded text-sm min-w-0 flex-1"
                              >
                                {TIME_SLOTS.map((slot) => (
                                  <option key={slot.endTime} value={slot.endTime}>
                                    {slot.endTime}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DoctorAvailability;