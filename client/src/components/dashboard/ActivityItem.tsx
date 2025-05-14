interface ActivityItemProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

const ActivityItem = ({
  icon,
  iconBg,
  iconColor,
  title,
  description,
}: ActivityItemProps) => {
  return (
    <li className="py-3">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${iconBg}`}>
            <span className={`material-icons ${iconColor} text-sm`}>{icon}</span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </li>
  );
};

export default ActivityItem;
