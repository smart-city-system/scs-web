"use client";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";
import { useEffect, useState } from "react";
function Header() {
	const [time, setTime] = useState(new Date());
	useEffect(() => {
		const timer = setInterval(() => {
			setTime(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, []);
	return (
		<div className="w-full flex p-2 shadow-sm">
			<div className="ml-auto flex gap-4">
				<div className="flex flex-col">
					<div className="font-semibold text-md">Saturday, Aug 2, 2025 </div>
					<div className="text-sm">{time.toLocaleTimeString()}</div>
				</div>
				<Button type="button" size="icon">
					<Bell />
				</Button>
				<Button type="button" size="icon">
					<User />
				</Button>
			</div>
		</div>
	);
}

export default Header;
