import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle } from "lucide-react";
import { Trip } from "@shared/schema";
import { format } from "date-fns";

interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  date: string;
  icon: string;
}

interface WeatherCardProps {
  weatherData: WeatherData;
  trip: Trip;
  onForecastClick: () => void;
  isLoading?: boolean;
}

export function WeatherCard({ weatherData, trip, onForecastClick, isLoading = false }: WeatherCardProps) {
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('sun') || conditionLower.includes('clear')) return <Sun className="h-10 w-10 text-yellow-500" />;
    if (conditionLower.includes('rain')) return <CloudRain className="h-10 w-10 text-blue-500" />;
    if (conditionLower.includes('snow')) return <CloudSnow className="h-10 w-10 text-blue-300" />;
    if (conditionLower.includes('thunder') || conditionLower.includes('lightning')) return <CloudLightning className="h-10 w-10 text-purple-500" />;
    if (conditionLower.includes('drizzle')) return <CloudDrizzle className="h-10 w-10 text-blue-400" />;
    return <Cloud className="h-10 w-10 text-gray-400" />;
  };

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  const formatDateRange = (start: Date, end: Date) => {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-white overflow-hidden shadow rounded-lg mb-6">
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full"></div>
                <div className="ml-3">
                  <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="flex items-center">
                    <div className="mr-4">
                      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mb-1"></div>
                      <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                    <div>
                      <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-1"></div>
                      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg mb-6">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <div className="flex items-center">
              {getWeatherIcon(weatherData.condition)}
              <div className="ml-3">
                <h3 className="text-lg font-semibold">Weather at your next destination</h3>
                <div className="flex items-center">
                  <div className="mr-4">
                    <p className="text-3xl font-bold">{weatherData.temperature}°C</p>
                    <p className="text-neutral-500">{weatherData.condition}</p>
                  </div>
                  <div>
                    <p className="text-neutral-600">
                      <span className="font-semibold">{trip.destination}</span>
                    </p>
                    <p className="text-neutral-500">{formatDateRange(startDate, endDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 w-full flex-shrink-0 sm:mt-0 sm:w-auto">
            <Button variant="outline" onClick={onForecastClick}>
              View 7-day Forecast
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
