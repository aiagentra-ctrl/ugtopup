import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  uid: z.string()
    .min(6, "UID must be at least 6 digits")
    .regex(/^\d+$/, "UID must contain only numbers"),
  username: z.string().optional(),
  whatsapp: z.string()
    .optional()
    .refine(
      (val) => !val || (val.length >= 10 && /^[0-9+\s()-]+$/.test(val)),
      { message: "Invalid WhatsApp number format" }
    ),
});

export type UserFormData = z.infer<typeof formSchema>;

interface UserInputFormProps {
  onDataChange: (data: UserFormData) => void;
  initialData?: Partial<UserFormData>;
}

export const UserInputForm = ({ onDataChange, initialData }: UserInputFormProps) => {
  const form = useForm<UserFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uid: initialData?.uid || "",
      username: initialData?.username || "",
      whatsapp: initialData?.whatsapp || "",
    },
    mode: "onChange",
  });

  const { watch } = form;

  // Watch all form values and notify parent
  const watchedValues = watch();
  
  // Notify parent of changes
  form.watch((data) => {
    if (form.formState.isValid) {
      onDataChange(data as UserFormData);
    }
  });

  return (
    <div className="glass-card rounded-lg p-6 space-y-4">
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Enter Game Details</h2>
      
      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="uid"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">
                  In-Game UID <span className="text-primary">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your UID"
                    type="text"
                    inputMode="numeric"
                    className="h-12 bg-input border-border focus:border-primary focus:ring-primary rounded-lg px-4 text-base transition-all duration-200 hover:border-primary/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">
                  In-Game Username <span className="text-muted-foreground text-sm">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your username"
                    className="h-12 bg-input border-border focus:border-primary focus:ring-primary rounded-lg px-4 text-base transition-all duration-200 hover:border-primary/50"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">For verification purposes</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground text-sm font-medium">
                  WhatsApp Number <span className="text-muted-foreground text-sm">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="+977 XXXXX XXXXX"
                    type="tel"
                    className="h-12 bg-input border-border focus:border-primary focus:ring-primary rounded-lg px-4 text-base transition-all duration-200 hover:border-primary/50"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">For order updates and support</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};
