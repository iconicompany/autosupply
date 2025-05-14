import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Validation schema
const auctionFormSchema = z.object({
  title: z.string().min(5, "Название должно содержать не менее 5 символов"),
  description: z.string().min(10, "Описание должно содержать не менее 10 символов"),
  auctionType: z.enum(["standard", "urgent", "limited"]),
  startDate: z.date(),
  endDate: z.date(),
  supplierIds: z.array(z.number()).optional(),
  specifications: z.string().optional(),
  items: z.array(
    z.object({
      partNumber: z.string().min(1, "Артикул обязателен"),
      name: z.string().min(1, "Название обязательно"),
      quantity: z.number().min(1, "Количество должно быть больше 0"),
      unitOfMeasure: z.string().min(1, "Единица измерения обязательна"),
      estimatedPrice: z.number().optional(),
      description: z.string().optional(),
      requiredDate: z.date().optional(),
    })
  ).min(1, "Добавьте хотя бы один товар"),
});

type AuctionFormValues = z.infer<typeof auctionFormSchema>;

const AuctionForm = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get suppliers list
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
  });

  // Form setup
  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      auctionType: "standard",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      supplierIds: [],
      specifications: "",
      items: [
        {
          partNumber: "",
          name: "",
          quantity: 1,
          unitOfMeasure: "шт",
          estimatedPrice: 0,
          description: "",
          requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default to 14 days from now
        },
      ],
    },
  });

  // Create auction mutation
  const createAuction = useMutation({
    mutationFn: async (data: AuctionFormValues) => {
      const response = await apiRequest('POST', '/api/auctions', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      toast({
        title: "Аукцион создан",
        description: "Аукцион успешно создан",
      });
      navigate('/auctions');
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать аукцион: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (data: AuctionFormValues) => {
    createAuction.mutate(data);
  };

  // Add/remove auction items
  const addItem = () => {
    const items = form.getValues("items") || [];
    form.setValue("items", [
      ...items,
      {
        partNumber: "",
        name: "",
        quantity: 1,
        unitOfMeasure: "шт",
        estimatedPrice: 0,
        description: "",
        requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    ]);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items");
    if (items.length <= 1) return; // Keep at least one item
    form.setValue(
      "items",
      items.filter((_, i) => i !== index)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название аукциона</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Например: Закупка тормозных дисков"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="auctionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип аукциона</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип аукциона" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="standard">Стандартный</SelectItem>
                    <SelectItem value="urgent">Срочный</SelectItem>
                    <SelectItem value="limited">С ограниченным доступом</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Дата начала</FormLabel>
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
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Дата окончания</FormLabel>
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
                        date <
                        new Date(form.getValues("startDate") || Date.now())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание и требования</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Подробное описание требований к закупке"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supplierIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Поставщики</FormLabel>
              <div className="border rounded-md p-3 space-y-3">
                {suppliers.map((supplier: any) => (
                  <div key={supplier.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`supplier-${supplier.id}`}
                      value={supplier.id}
                      checked={(field.value || []).includes(supplier.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const value = parseInt(e.target.value);
                        const currentValues = field.value || [];
                        field.onChange(
                          checked
                            ? [...currentValues, value]
                            : currentValues.filter((id) => id !== value)
                        );
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor={`supplier-${supplier.id}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      {supplier.companyName}
                    </label>
                  </div>
                ))}
                {suppliers.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Нет доступных поставщиков
                  </p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Товары для закупки
          </h3>
          <div className="space-y-6">
            {form.watch("items").map((_, index) => (
              <div
                key={index}
                className="border rounded-md p-4 bg-gray-50 relative"
              >
                <button
                  type="button"
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
                  onClick={() => removeItem(index)}
                  disabled={form.watch("items").length <= 1}
                >
                  <span className="material-icons">close</span>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.partNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Артикул</FormLabel>
                        <FormControl>
                          <Input placeholder="Например: TY-1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Например: Тормозной диск"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitOfMeasure`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Единица измерения</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Ед. изм." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="шт">шт</SelectItem>
                            <SelectItem value="кг">кг</SelectItem>
                            <SelectItem value="л">л</SelectItem>
                            <SelectItem value="м">м</SelectItem>
                            <SelectItem value="компл">компл</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.estimatedPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ожидаемая цена (₽)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Дополнительная информация о товаре"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.requiredDate`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Требуемая дата</FormLabel>
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
                                date <
                                new Date(
                                  form.getValues("startDate") || Date.now()
                                )
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addItem}>
              <span className="material-icons mr-2">add</span>
              Добавить товар
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="specifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Спецификация (URL)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ссылка на документ спецификации"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/auctions')}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={createAuction.isPending}>
            {createAuction.isPending ? "Создание..." : "Создать аукцион"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AuctionForm;
