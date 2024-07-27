import { useState, useEffect } from 'react';
import Script from 'next/script';
import toast from 'react-hot-toast';
import authUtils from '@/app/utils/authUtils';
import { useRouter, useSearchParams } from 'next/navigation';

interface UserInfo {
  firstname: string;
  lastname: string;
  email: string;
}

interface PayWithSpayProps {
  cartTotal: number;
}

const PayWithSpay = ({ cartTotal }: PayWithSpayProps) => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const searchParams = useSearchParams();
  const orderId = decodeURIComponent(searchParams.get('order') || '');
  const deliveryFee = 60;

  useEffect(() => {
    // Simulate fetching user info
    const fetchedUserInfo = authUtils.getUserInfo();
    if (fetchedUserInfo) {
      setUserInfo(fetchedUserInfo);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && userInfo) {
      window.payWithSpay = function () {
        const handler = {
          amount: cartTotal + deliveryFee,
          currency: 'NGN',
          reference: `myhomeetal-${orderId}`,
          merchantCode: 'MCH_la8whiqumgh489i',
          customer: {
            firstName: userInfo?.firstname,
            lastName: userInfo?.lastname,
            phone: '0813575SPAY',
            email: userInfo?.email,
          },
          callback: function (response) {
            if (response.status === 'FAILED') {
              toast.error('payment failed, please try again!');
            } else if (response.status === 'SUCCESSFUL') {
              router.push(
                `/order-confirmed?id=${orderId}-${response.amount}-${response.paymentMethod}`
              );
            }
          },
          onClose: function () {
            window.location.reload();
          },
        };

        try {
          window.SpayCheckout.init(handler);
        } catch (error) {
          console.error('Error initializing SpayCheckout:', error);
        }
      };
    }
  }, [scriptLoaded, userInfo, cartTotal]);

  return (
    <>
      <Script
        src='https://testcheckout.spaybusiness.com/pay/static/js/spay_checkout.js'
        strategy='afterInteractive'
        onLoad={() => {
          setScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('Error loading SpayCheckout script:', e);
        }}
      />
      <link
        href='https://testcheckout.spaybusiness.com/pay/static/css/spay_checkout.css'
        rel='stylesheet'
      />
      <button
        className='rounded-xl bg-white px-10 py-4 font-clashmd text-base'
        id='payWithSpay'
        onClick={(e) => {
          e.stopPropagation();
          if (window.payWithSpay) {
            try {
              window.payWithSpay();
            } catch (error) {
              console.error('Error during payWithSpay execution:', error);
            }
          } else {
            console.error('payWithSpay function is not defined');
          }
        }}
        disabled={!userInfo}
      >
        Pay With Spay
      </button>
    </>
  );
};

export default PayWithSpay;
