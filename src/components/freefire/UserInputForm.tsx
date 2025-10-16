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
  zoneId: z.string().optional(),
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
      zoneId: initialData?.zoneId || "",
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
      <h2 className="text-2xl font-bold text-foreground">Enter Game Details</h2>
      
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
                    className="bg-input border-border focus:border-primary focus:ring-primary"
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
                    className="bg-input border-border focus:border-primary focus:ring-primary"
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
            name="zoneId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">
                  Zone ID <span className="text-muted-foreground text-sm">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your Zone ID"
                    className="bg-input border-border focus:border-primary focus:ring-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};
