import { Button } from "@/components/ui/button";

interface ApprovalItemProps {
  title: string;
  subtitle1: string;
  subtitle1Value: string;
  subtitle2?: string;
  subtitle2Value?: string;
  onDetails: () => void;
  onApprove: () => void;
  approveText?: string;
}

const ApprovalItem = ({
  title,
  subtitle1,
  subtitle1Value,
  subtitle2,
  subtitle2Value,
  onDetails,
  onApprove,
  approveText = "Принять",
}: ApprovalItemProps) => {
  return (
    <li className="py-3">
      <div className="flex justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <p className="mt-1 text-sm text-gray-500">
            {subtitle1}: <span className="font-medium">{subtitle1Value}</span>
          </p>
          {subtitle2 && subtitle2Value && (
            <p className="text-sm text-gray-500">
              {subtitle2}: <span className="font-medium text-green-600">{subtitle2Value}</span>
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDetails}
          >
            Детали
          </Button>
          <Button
            size="sm"
            onClick={onApprove}
          >
            {approveText}
          </Button>
        </div>
      </div>
    </li>
  );
};

export default ApprovalItem;
