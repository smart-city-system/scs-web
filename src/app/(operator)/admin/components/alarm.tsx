import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface props {
	severity: string;
	type: string;
	description: string;
	location: string;
}
function Alarm({ severity, description, type, location }: props) {
	return (
		<div
			className={cn("bg-white border rounded-lg shadow-sm p-2", {
				"bg-red-200 border-red-200": severity === "high",
				"bg-orange-200 border-orange-200": severity === "medium",
				"bg-yellow-200 border-yellow-200": severity === "low",
			})}
		>
			<h3
				className={cn("text-sm font-semibold", {
					"text-red-900": severity === "high",
					"text-orange-900": severity === "medium",
					"text-yellow-900": severity === "low",
				})}
			>
				{type}
			</h3>
			<div
				className={cn("text-xs", {
					"text-red-700": severity === "high",
					"text-orange-700": severity === "medium",
					"text-yellow-700": severity === "low",
				})}
			>
				{description}
			</div>
			<div
				className={cn("text-xs mt-1", {
					"text-red-600": severity === "high",
					"text-orange-600": severity === "medium",
					"text-yellow-600": severity === "low",
				})}
			>
				{location}
			</div>
			<Button className="w-full mt-2">Dispatch</Button>
		</div>
	);
}

export default Alarm;
