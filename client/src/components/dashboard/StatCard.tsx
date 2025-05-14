import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface StatCardProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  title: string;
  value: number | string;
  linkText: string;
  linkUrl: string;
}

const StatCard = ({
  icon,
  iconColor,
  bgColor,
  title,
  value,
  linkText,
  linkUrl,
}: StatCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md ${bgColor} p-3`}>
            <span className={`material-icons ${iconColor}`}>{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <Link href={linkUrl}>
            <a className="font-medium text-primary-600 hover:text-primary-500">
              {linkText}
            </a>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default StatCard;
