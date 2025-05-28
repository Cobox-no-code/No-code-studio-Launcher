"use client";
import React, { useEffect, useState } from "react";
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  Shield,
  Calendar,
  Star,
  Clock,
  AlertTriangle,
  Monitor,
  Building,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { backend_url } from "@/backend.config";
import { useAppSelector } from "@/redux/hooks";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

type PlanType = {
  id: number;
  name: string;
  description: string;
  price: string;
  discount: string;
  discounted_price: number;
  duration_days: number;
  max_devices: number;
  max_firms: number | null;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function EnhancedPricingSection() {
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loading, setLoading] = useState(false);
  const userInfo = useAppSelector((state) => state.userinfo);
  const router = useRouter();

  // Check if user has active subscription that's not free and not expired
  const hasActiveSubscription = (): boolean => {
    if (!userInfo?.subscription) return false;

    const isExpired = userInfo.subscription.end_date
      ? new Date(userInfo.subscription.end_date) < new Date()
      : true;

    const isFree = userInfo.subscription.plan_name
      ?.toLowerCase()
      .includes("free");

    return !isExpired && !isFree;
  };

  // Get current subscription plan ID
  const getCurrentPlanId = (): number | null => {
    if (!userInfo?.subscription?.plan_name) return null;

    const matchingPlan = plans.find(
      (plan) =>
        plan.name.toLowerCase() ===
        userInfo.subscription.plan_name.toLowerCase()
    );

    return matchingPlan?.id || null;
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${backend_url}/subscription/plans`)
      .then((res) => res.json())
      .then((data) => {
        setPlans(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load plans", err);
        setLoading(false);
      });
  }, []);

  const handleSubscribe = async (plan: PlanType) => {
    const customer_id = localStorage.getItem("customer_id");
    if (!customer_id) return alert("Customer not found in localStorage");

    // Check if user already has any active subscription
    if (userInfo?.subscription) {
      // Don't allow switching to free if any plan is active
      if (Number(plan.discounted_price) === 0) {
        alert(
          "You must wait until your current subscription expires before switching to the free plan."
        );
        return;
      }

      // Check if trying to subscribe to another paid plan while having an active paid plan
      if (hasActiveSubscription() && Number(plan.discounted_price) > 0) {
        alert(
          "You already have an active subscription. You can only upgrade when your current plan expires."
        );
        return;
      }
    }

    if (Number(plan.discounted_price) === 0) {
      // Free plan, directly activate without Razorpay
      const res = await fetch(`${backend_url}/subscription/verify-payment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: plan.id,
          user: { id: customer_id },
          razorpay_payment_id: null,
          razorpay_order_id: null,
          razorpay_signature: null,
        }),
      });
      const result = await res.json();
      toast.success(result.status || "Free trial activated!");
      return;
    }

    // Paid plan flow
    try {
      const res = await fetch(`${backend_url}/subscription/create-order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id, user_id: customer_id }),
      });

      const data = await res.json();
      if (!data.order_id) return alert("Order creation failed");

      const rzp = new window.Razorpay({
        key: data.razorpay_key,
        amount: data.amount,
        currency: data.currency,
        name: "Paper Bill",
        description: `Payment for ${data.plan.name}`,
        order_id: data.order_id,
        handler: async (response: any) => {
          await fetch(`${backend_url}/subscription/verify-payment/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id,
              user: { id: customer_id },
            }),
          });
          toast.success("Subscription successful!");
          router.push("/pricing");
        },
        theme: { color: "#000000" },
      });

      rzp.open();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Get discount percentage
  const getDiscountPercentage = (original: string, discounted: number) => {
    const originalPrice = parseFloat(original);
    if (isNaN(originalPrice) || originalPrice <= 0) return 0;
    return Math.round(((originalPrice - discounted) / originalPrice) * 100);
  };

  // Function to check if plan is current active plan
  const isCurrentPlan = (planId: number): boolean => {
    return getCurrentPlanId() === planId;
  };

  // Filter plans based on billing cycle
  const filteredPlans = plans.filter((plan) => {
    if (billingCycle === "monthly") {
      return plan.duration_days <= 31; // Monthly plans (including weekly)
    } else {
      return plan.duration_days >= 365; // Yearly plans
    }
  });

  // Calculate time remaining for current subscription
  const getTimeRemaining = (): { days: number; hours: number } | null => {
    if (!userInfo?.subscription?.end_date) return null;

    const now = new Date();
    const endDate = new Date(userInfo.subscription.end_date);

    if (endDate <= now) return { days: 0, hours: 0 };

    const diffInMs = endDate.getTime() - now.getTime();
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    return { days, hours };
  };

  // Get subscription status message
  const getSubscriptionStatus = (): {
    message: string;
    isActive: boolean;
    isExpired: boolean;
  } => {
    if (!userInfo?.subscription) {
      return {
        message: "No active subscription",
        isActive: false,
        isExpired: false,
      };
    }

    const endDate = new Date(userInfo.subscription.end_date);
    const now = new Date();
    const isExpired = endDate <= now;

    if (isExpired) {
      return {
        message: "Your subscription has expired",
        isActive: false,
        isExpired: true,
      };
    }

    const timeLeft = getTimeRemaining();
    if (!timeLeft)
      return {
        message: "Active subscription",
        isActive: true,
        isExpired: false,
      };

    if (timeLeft.days > 0) {
      return {
        message: `${timeLeft.days} days ${timeLeft.hours} hours remaining`,
        isActive: true,
        isExpired: false,
      };
    }

    return {
      message: `${timeLeft.hours} hours remaining`,
      isActive: true,
      isExpired: false,
    };
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="bg-white min-h-screen py-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-black">
            Choose Your Perfect Plan
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Select the right plan for your business needs and start streamlining
            your invoicing process today.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 mb-10">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium ${
                billingCycle === "monthly"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full text-sm font-medium ${
                billingCycle === "yearly"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Yearly
              <Badge className="ml-1 bg-yellow-100 text-yellow-800 border-0">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {filteredPlans.map((plan, index) => {
              const discountPercentage = getDiscountPercentage(
                plan.price,
                plan.discounted_price
              );

              // Get icon for plan
              const PlanIcon =
                index === 0 ? Calendar : index === 1 ? Shield : Sparkles;

              // Check if this is a popular plan
              const isPopular = index === 1;

              // Check if this is the current active plan
              const isActive = isCurrentPlan(plan.id);

              // Check if user has active paid subscription
              const hasActivePaidPlan = hasActiveSubscription();

              // Determine button state
              const isFree = Number(plan.discounted_price) === 0;

              // Disable free plan if any subscription is active
              // Disable paid plans if user has active paid subscription
              const buttonDisabled =
                isActive ||
                (isFree && userInfo?.subscription) ||
                (hasActivePaidPlan && !isFree);

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    isActive
                      ? "border-green-500 bg-green-50/30 shadow-lg"
                      : isPopular
                      ? "border-red-500 shadow-lg transform hover:-translate-y-2"
                      : "hover:-translate-y-1"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-green-600 text-white py-1 px-8 transform rotate-45 translate-x-8 translate-y-2">
                      Current
                    </div>
                  )}

                  {isPopular && !isActive && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white py-1 px-8 transform rotate-45 translate-x-8 translate-y-2">
                      Popular
                    </div>
                  )}

                  <CardHeader
                    className={`pb-0 ${
                      isPopular && !isActive ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isActive
                            ? "bg-green-100 text-green-700"
                            : isPopular
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <PlanIcon size={20} />
                      </div>
                      <h3 className="text-lg font-bold ml-2">{plan.name}</h3>
                      {discountPercentage > 0 && (
                        <Badge className="ml-auto bg-yellow-100 text-yellow-800 border-0">
                          Save {discountPercentage}%
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4">
                      {plan.discount && parseFloat(plan.discount) > 0 && (
                        <span className="text-gray-400 line-through mr-2">
                          ₹{plan.price}
                        </span>
                      )}
                      <span className="text-4xl font-bold">
                        ₹{Number(plan.discounted_price).toFixed(0)}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">
                        /
                        {plan.duration_days === 7
                          ? "week"
                          : plan.duration_days <= 31
                          ? "month"
                          : "year"}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="text-gray-600 text-sm mt-2 mb-5">
                        {plan.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-6">
                    <ul className="space-y-3 mb-6">
                      {/* Device Access */}
                      <li className="flex items-start">
                        <Monitor
                          className={`h-5 w-5 mr-3 ${
                            isActive
                              ? "text-green-500"
                              : isPopular
                              ? "text-red-500"
                              : "text-black"
                          }`}
                        />
                        <span className="text-gray-700">
                          {plan.max_devices} device
                          {plan.max_devices > 1 ? "s" : ""} access
                        </span>
                      </li>

                      {/* Firms Access */}
                      <li className="flex items-start">
                        <Building
                          className={`h-5 w-5 mr-3 ${
                            isActive
                              ? "text-green-500"
                              : isPopular
                              ? "text-red-500"
                              : "text-black"
                          }`}
                        />
                        <span className="text-gray-700">
                          {plan.max_firms === null
                            ? "Unlimited firms"
                            : `${plan.max_firms} firm${
                                plan.max_firms > 1 ? "s" : ""
                              }`}
                        </span>
                      </li>

                      {/* Duration */}
                      <li className="flex items-start">
                        <Clock
                          className={`h-5 w-5 mr-3 ${
                            isActive
                              ? "text-green-500"
                              : isPopular
                              ? "text-red-500"
                              : "text-black"
                          }`}
                        />
                        <span className="text-gray-700">
                          {plan.duration_days} days access
                        </span>
                      </li>

                      {/* Discount (if applicable) */}
                      {parseFloat(plan.discount) > 0 && (
                        <li className="flex items-start">
                          <Star
                            className={`h-5 w-5 mr-3 ${
                              isActive
                                ? "text-green-500"
                                : isPopular
                                ? "text-red-500"
                                : "text-black"
                            }`}
                          />
                          <span className="text-gray-700">
                            ₹{plan.discount} discount applied
                          </span>
                        </li>
                      )}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button
                              className={`w-full group ${
                                isActive
                                  ? "bg-green-600 hover:bg-green-700 text-white cursor-default"
                                  : isPopular
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : isFree
                                  ? "bg-gray-400 hover:bg-gray-500 text-white"
                                  : "bg-black hover:bg-gray-800 text-white"
                              }`}
                              disabled={!!buttonDisabled}
                              onClick={() => handleSubscribe(plan)}
                            >
                              {isActive
                                ? "Current Plan"
                                : buttonDisabled
                                ? isFree
                                  ? "Unavailable"
                                  : "Unavailable"
                                : isFree
                                ? "Start Free Trial"
                                : "Get Started"}
                              {!buttonDisabled && (
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                              )}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {buttonDisabled && !isActive && (
                          <TooltipContent>
                            <p>
                              {isFree
                                ? "You already have an active subscription"
                                : "You can only change plans after your current subscription expires"}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
