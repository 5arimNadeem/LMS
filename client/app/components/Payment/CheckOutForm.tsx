import { useCreateOrderMutation } from "@/redux/features/orders/ordersApi";
import {
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

type Props = {
    setOpen: (open: boolean) => void;
    data: any;
    user: any;
    refetch: any;
};

const CheckOutForm = ({ setOpen, data, user, refetch }: Props) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [createOrder, { data: orderData, error }] = useCreateOrderMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });

        if (error) {
            setMessage(error.message || "Something went wrong with the payment");
            setIsLoading(false);
            return;
        }

        if (paymentIntent && paymentIntent.status === "succeeded") {
            createOrder({ courseId: data._id, payment_info: paymentIntent });
        }

        setIsLoading(false);
    };

    React.useEffect(() => {
        if (orderData) {
            refetch();
            toast.success("Order completed successfully!");
            setOpen(false);
        }
        if (error) {
            const errorMessage = error as any;
            toast.error(errorMessage?.data?.message || "Order could not be created");
        }
    }, [orderData, error, refetch, setOpen]);

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" />
            <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="w-full mt-4 h-[40px] rounded-[4px] bg-[crimson] text-white disabled:opacity-60"
            >
                <span id="button-text">
                    {isLoading ? "Processing..." : `Pay $${data.price}`}
                </span>
            </button>
            {message && (
                <div id="payment-message" className="text-red-500 mt-2">
                    {message}
                </div>
            )}
        </form>
    );
};

export default CheckOutForm;
