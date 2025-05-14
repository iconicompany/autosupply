import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AuctionItem {
  id: number;
  partNumber: string;
  name: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedPrice?: number;
  description?: string;
}

interface BidFormProps {
  auctionId: number;
  auctionItems: AuctionItem[];
  onBidSubmitted?: () => void;
}

// Form validation schema
const bidFormSchema = z.object({
  deliveryDate: z.date({
    required_error: "Пожалуйста, выберите дату доставки",
  }),
  note: z.string().optional(),
  items: z.array(
    z.object({
      auctionItemId: z.number(),
      pricePerUnit: z.number().min(1, "Цена должна быть больше 0"),
      quantity: z.number().min(1, "Количество должно быть больше 0"),
    })
  ),
});

type BidFormValues = z.infer<typeof bidFormSchema>;

const BidForm = ({ auctionId, auctionItems, onBidSubmitted }: BidFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with default values
  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 14 days from now
      note: "",
      items: auctionItems.map((item) => ({
        auctionItemId: item.id,
        pricePerUnit: item.estimatedPrice || 0,
        quantity: item.quantity,
      })),
    },
  });

  // Calculate total price
  const calculateTotalPrice = (formValues: BidFormValues) => {
    return formValues.items.reduce(
      (total, item) => total + item.pricePerUnit * item.quantity,
      0
    );
  };

  // Submit bid mutation
  const submitBid = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/auctions/${auctionId}/bids`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      toast({
        title: "Предложение отправлено",
        description: "Ваше предложение успешно отправлено на рассмотрение",
      });
      if (onBidSubmitted) {
        onBidSubmitted();
      }
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить предложение",
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (data: BidFormValues) => {
    // Calculate total amount
    const totalAmount = calculateTotalPrice(data);
    
    // Construct complete bid data
    const bidData = {
      ...data,
      totalAmount,
      auctionId,
    };
    
    submitBid.mutate(bidData);
  };

  // Total price calculation
  const totalPrice = calculateTotalPrice(form.watch());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Отправить предложение</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-6">
              <h3 className="text-md font-medium mb-4">Товары</h3>
              <div className="space-y-6">
                {auctionItems.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">Артикул: {item.partNumber}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                      <div>
                        <p className="text-sm text-gray-500">Требуемое количество</p>
                        <p className="font-medium">{item.quantity} {item.unitOfMeasure}</p>
                      </div>
                      {item.estimatedPrice && (
                        <div>
                          <p className="text-sm text-gray-500">Ожидаемая цена</p>
                          <p className="font-medium">₽{item.estimatedPrice.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Ваша цена за единицу</p>
                        <FormField
                          control={form.control}
                          name={`items.${index}.pricePerUnit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Итого за позицию:</p>
                        <p className="font-medium">
                          ₽{(form.watch(`items.${index}.pricePerUnit`) * item.quantity).toLocaleString() || "0"}
                        </p>
                      </div>
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <input type="hidden" {...field} />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.auctionItemId`}
                        render={({ field }) => (
                          <input type="hidden" {...field} />
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Дата доставки</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ru })
                            ) : (
                              <span>Выберите дату</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примечание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Дополнительная информация к предложению"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Общая сумма предложения:</p>
                <p className="text-xl font-semibold text-primary-600">
                  ₽{totalPrice.toLocaleString()}
                </p>
              </div>
              <Button
                type="submit"
                disabled={submitBid.isPending}
              >
                {submitBid.isPending ? "Отправка..." : "Отправить предложение"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BidForm;
