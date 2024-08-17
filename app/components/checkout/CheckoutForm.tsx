'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { ArrowRight } from 'iconsax-react';
import OrderSummary from './OrderSummary';
import Input from '@components/Input';
import RadioItem from '@components/RadioItem';
import ClientOnly from '@components/ClientOnly';
import Link from 'next/link';
import { useAddressBook } from '@/app/addressBookProvider';
import authUtils from '@/app/utils/authUtils';
import toast from 'react-hot-toast';
import { numberToWords, useCartActions } from '@/app/utils/helpers';
import { locations } from '@/app/utils/constants';
import productService from '@/app/services/productService';
import Button from '../Button';
import { HomeSkeleton } from '../loader';
import { useCart } from '@/app/CartProvider';

interface Address {
  _id: string;
  deliveryAddress: string;
  phone_number: string;
  city: string;
}

interface UserInfo {
  firstname: string;
  lastname: string;
  id: string;
}

const CheckoutForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddLoading, setIsAddLoading] = useState<boolean>(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState<boolean>(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const {
    setFirstStageCompleted,
    firstStageCompleted,
    setSelectedDeliveryMethod,
    selectedDeliveryMethod,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  } = useAddressBook();
  const { cartState } = useCart();
  const [isAddAddress, setIsAddAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    addresses.length > 0 ? addresses[0] : null
  );
  const [isChange, setIsChange] = useState(false);
  const [deliveryDates, setDeliveryDates] = useState({ start: '', end: '' });
  const [isEdit, setIsEdit] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [myAddress, setMyAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [error, setError] = useState('');
  const [myindex, setIndex] = useState<number | null>(null);
  const [id, setId] = useState('');
  const [hasWallet, setHasWallet] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [point, setPoint] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const validItems = cartState.items?.filter(item =>
    item?.product && !isNaN(parseFloat(item.product.price))
  ) || [];

  const { fetchCart } = useCartActions();

  const myFetch = async () => {
    try {
      await fetchCart();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    const fetchedUserInfo = authUtils.getUserInfo();
    setUserInfo(fetchedUserInfo);

    const fetchData = async () => {
      try {
        const [addressRes, walletRes, referralRes] = await Promise.allSettled([
          productService.getAddress(),
          productService.getWallet(),
          productService.getUserReferrals(),
        ]);
        if (addressRes.status === 'fulfilled') {
          setAddresses(addressRes.value.data);
        } else {
          console.error('Address fetch failed:', addressRes.reason);
        }
        if (walletRes.status === 'fulfilled') {
          if (walletRes.value.data.account_no) {
            setHasWallet(true);
            setWallet(walletRes.value.data);
          } else {
            setHasWallet(false);
            setWallet(null);
            console.log('Wallet data not available');
          }
        } else {
          console.error('Wallet fetch failed:', walletRes.reason);
        }
        if (referralRes.status === 'fulfilled') {
          setPoint(referralRes.value.data.data.totalEarnings);
        } else {
          console.error('Referral fetch failed:', referralRes.reason);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    };

    const calculateDeliveryDates = () => {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() + 1); // Start date is tomorrow
      const endDate = new Date();
      endDate.setDate(today.getDate() + 4); // End date is three days after the start date

      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
      };

      setDeliveryDates({
        start: startDate.toLocaleDateString('en-GB', options),
        end: endDate.toLocaleDateString('en-GB', options),
      });
    };
    const savedState = JSON.parse(localStorage.getItem('checkoutState'));
    if (savedState) {
      setSelectedAddress(savedState.address || null);
      setFirstStageCompleted(savedState.firstStage || false);
      setSelectedDeliveryMethod(savedState.deliveryMethod || '');
      setSelectedPaymentMethod(savedState.selectedPayment || '');
    }
    myFetch();
    fetchData();
    calculateDeliveryDates();
    setUserInfo(fetchedUserInfo);
  }, []);

  useEffect(() => {
    // Ensure that the address list is updated after creating a new address
    setSelectedAddress(addresses.length > 0 ? addresses[0] : null);
  }, [addresses]);

  const handleAddressClick = (address) => {
    setSelectedAddress(address);
    const selectedLocation = locations.find(
      (location) => location.name === address.lga
    );

    setDeliveryFee(selectedLocation?.fee);
  };

  const handleSelectChange = (location) => {
    setSelectedLocation(location);
    setSearchTerm('');
    setDropdownOpen(false); // Close dropdown after selection
  };

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePhoneChange = (e) => {
    const inputValue = e.target.value;
    // Allow digits and the '+' character at the beginning
    const isNumber = /^[+]?\d*$/.test(inputValue);

    if (!isNumber) {
      setError('Invalid Phone Number format');
    } else {
      setError('');
      setPhoneNumber(inputValue);
    }
  };
  const addressInWords = numberToWords(myindex + 1);

  //get user address
  const getAddress = async () => {
    try {
      const res = await productService.getAddress();
      if (res.status === 200) {
        setAddresses(res?.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  //create address
  const createMyAddress = async () => {
    setIsAddLoading(true);
    if (myAddress && phoneNumber && selectedLocation) {
      try {
        const payload = {
          deliveryAddress: myAddress,
          phone_number: phoneNumber,
          city: selectedLocation,
        };
        const res = await productService.createAddress(payload);
        if (res.status === 200) {
          setMyAddress('');
          setPhoneNumber('');
          setSelectedLocation('');
          toast.success('Address created successfully');
          setIsAddAddress(false);
          setIsLoading(false);
          getAddress();
        }
      } catch (error) {
        console.log(error);
        toast.error('An error occured. Please try again!');
        setIsAddLoading(false);
      } finally {
        setIsAddLoading(false);
      }
    } else {
      toast.error('All fields are required');
    }
  };

  //edit address
  const handleEdit = (
    address: string,
    phone: string,
    index: number,
    id: string,
    lga: string
  ) => {
    setMyAddress(address);
    setPhoneNumber(phone);
    setIndex(index);
    setId(id);
    setSelectedLocation(lga);
    setIsEdit(true);
  };

  const editMyAddress = async () => {
    setIsUpdateLoading(true);
    try {
      const payload = {
        addressId: id,
        deliveryAddress: myAddress,
        phone_number: phoneNumber,
        city: selectedLocation,
      };
      const res = await productService.updateAddress(payload);
      if (res.status === 200) {
        setMyAddress('');
        setPhoneNumber('');
        toast.success('Address updated successfully');
        setIsEdit(false);
        setIsUpdateLoading(false);
        getAddress();
      }
    } catch (error) {
      console.log(error);
      toast.error('An error ocurred. Plese try again!');
      setIsUpdateLoading(false);
    } finally {
      setIsUpdateLoading(false);
    }
  };

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <ClientOnly>
      <div className='grid gap-5 lg:grid-cols-[2fr_1fr]'>
        {(isEdit || isAddAddress) && (
          <div
            onClick={() => (isEdit ? setIsEdit(false) : setIsAddAddress(false))}
            className='fixed bottom-0 left-0 right-0 top-0 z-50 items-center justify-center bg-[#292929]/50 lg:flex'
          >
            {/**Edit container */}
            {isEdit && (
              <div className='absolute top-[40%] mt-20 min-w-full translate-y-[-50%] px-[3%] lg:min-w-[1115px] lg:px-0'>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className='mx-auto rounded-2xl bg-[#f4f4f4] px-5 py-10 lg:mt-24 lg:block lg:min-w-[1115px]'
                >
                  <div className='grid-cols-2 gap-5 lg:grid'>
                    <div>
                      <p className='font-clashmd text-xs lg:text-base'>
                        Address {addressInWords}
                      </p>
                      <p className='max-w-[243px] text-[10px] lg:max-w-[497px] lg:text-sm'>
                        Ensure the details entered are accurate to avoid issues
                        during product delivery
                      </p>
                    </div>
                    <div className='hidden gap-2 lg:grid'>
                      <label className='font-clashmd text-[10px] text-black lg:font-clash lg:text-xs'>
                        City (only in Lagos*)
                      </label>
                      <div className='grid gap-2'>
                        <input
                          type="text"
                          placeholder={selectedLocation || 'Select your location...'}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="h-[50px] w-full rounded-[10px] bg-white px-4 text-xs placeholder:text-xs placeholder:text-[#989898] lg:h-[56px] lg:rounded-xl lg:text-sm lg:placeholder:text-sm lg:placeholder:text-black"
                        />
                        {dropdownOpen && (
                          <div className="relative">
                            <div className="absolute z-10 mt-2 h-[150px] custom-scrollbar w-full overflow-y-scroll rounded-[10px] bg-white shadow-lg">
                              {filteredLocations.map((lga, i) => (
                                <div
                                  key={i}
                                  onClick={() => handleSelectChange(lga.name)}
                                  className={`cursor-pointer px-4 py-2 text-xs ${selectedLocation === lga.name
                                    ? 'bg-gray-200'
                                    : 'hover:bg-gray-100'
                                    }`}
                                >
                                  {lga.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='mt-5 grid gap-5 lg:grid-cols-2'>
                    <Input
                      name='address'
                      value={myAddress}
                      onChange={(e) => setMyAddress(e.target.value)}
                      labelKey='Delevery Address'
                      placeholder='Enter a Valid address'
                      labelClassName='text-[10px] font-clashmd lg:font-clash lg:text-xs text-black'
                      inputClassName='h-[56px] text-xs bg-white placeholder:text-sm placeholder:text-black'
                    />
                    <Input
                      name='phoneNumber'
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      errorKey={error}
                      labelKey='Phone Number'
                      placeholder='Enter your Phone Number'
                      labelClassName='text-[10px] font-clashmd lg:font-clash lg:text-xs text-black'
                      inputClassName='h-[56px] text-xs bg-white placeholder:text-sm placeholder:text-black'
                    />
                    <div className='grid gap-2 lg:hidden'>
                      <label className='font-clashmd text-[10px] text-black lg:font-clash lg:text-xs'>
                        City (only in Lagos*)
                      </label>
                      <div className='grid gap-2'>
                        <input
                          type="text"
                          placeholder={selectedLocation || 'Select your location...'}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="h-[50px] w-full rounded-[10px] bg-white px-4 text-xs placeholder:text-xs placeholder:text-[#989898] lg:h-[56px] lg:rounded-xl lg:text-sm lg:placeholder:text-sm lg:placeholder:text-black"
                        />
                        {dropdownOpen && (
                          <div className="relative">
                            <div className="absolute z-10 mt-2 h-[150px] custom-scrollbar w-full overflow-y-scroll rounded-[10px] bg-white shadow-lg">
                              {filteredLocations.map((lga, i) => (
                                <div
                                  key={i}
                                  onClick={() => handleSelectChange(lga.name)}
                                  className={`cursor-pointer px-4 py-2 text-xs ${selectedLocation === lga.name
                                    ? 'bg-gray-200'
                                    : 'hover:bg-gray-100'
                                    }`}
                                >
                                  {lga.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className='flex items-center justify-center'
                >
                  <Button
                    onClick={editMyAddress}
                    disabled={isUpdateLoading}
                    loading={isUpdateLoading}
                    className='mx-auto mt-10 h-[50px] w-full max-w-[391px] rounded-[10px] border-0 bg-primary text-center font-clashmd text-base text-white shadow-none lg:rounded-full'
                  >
                    Update Address
                  </Button>
                </div>
              </div>
            )}
            {/**Add container */}
            {isAddAddress && (
              <div className='absolute top-[50%] min-w-full translate-y-[-50%] px-[3%]'>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className='mt-10 rounded-xl bg-[#f4f4f4] px-5 py-10 lg:mx-auto lg:mt-24 lg:block lg:max-w-[582px] lg:rounded-2xl'
                >
                  <div className='mx-auto grid gap-5 lg:max-w-[503px]'>
                    <Input
                      name='address'
                      onChange={(e) => setMyAddress(e.target.value)}
                      labelKey='Delevery Address'
                      placeholder='Enter a Valid address'
                      labelClassName='text-[10px] font-clashmd lg:font-clash lg:text-xs text-black'
                      inputClassName='h-[50px] w-full lg:text-sm text-xs rounded-[10px] lg:rounded-2xl lg:h-[56px] bg-white placeholder:text-xs placeholder:text-[#989898] lg:placeholder:text-sm lg:placeholder:text-black'
                    />
                    <Input
                      name='phoneNumber'
                      onChange={handlePhoneChange}
                      errorKey={error}
                      labelKey='Phone Number'
                      placeholder='Enter your Phone Number'
                      labelClassName='text-[10px] font-clashmd lg:font-clash lg:text-xs text-black'
                      inputClassName='h-[50px] lg:text-sm text-xs rounded-[10px] lg:rounded-2xl lg:h-[56px] bg-white placeholder:text-xs placeholder:text-[#989898] lg:placeholder:text-sm lg:placeholder:text-black'
                    />
                    <div className='grid gap-2'>
                      <label className='font-clashmd text-[10px] text-black lg:font-clash lg:text-xs'>
                        City (only in Lagos*)
                      </label>
                      <div className='grid gap-2'>
                        <input
                          type="text"
                          placeholder={selectedLocation || 'Select your location...'}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="h-[50px] w-full rounded-[10px] bg-white px-4 text-xs placeholder:text-xs placeholder:text-[#989898] lg:h-[56px] lg:rounded-xl lg:text-sm lg:placeholder:text-sm lg:placeholder:text-black"
                        />
                        {dropdownOpen && (
                          <div className="relative">
                            <div className="absolute z-10 mt-2 h-[150px] custom-scrollbar w-full overflow-y-scroll rounded-[10px] bg-white shadow-lg">
                              {filteredLocations.map((lga, i) => (
                                <div
                                  key={i}
                                  onClick={() => handleSelectChange(lga.name)}
                                  className={`cursor-pointer px-4 py-2 text-xs ${selectedLocation === lga.name
                                    ? 'bg-gray-200'
                                    : 'hover:bg-gray-100'
                                    }`}
                                >
                                  {lga.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='hidden items-center justify-center lg:flex'>
                    <Button
                      onClick={createMyAddress}
                      loading={isAddLoading}
                      disabled={isAddLoading}
                      className='mx-auto mt-10 h-[50px] w-full max-w-[391px] rounded-full border-0 bg-primary text-center font-clashmd text-base text-white shadow-none'
                    >
                      Create a New Address
                    </Button>
                  </div>
                </div>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className='flex items-center justify-center lg:hidden'
                >
                  <Button
                    onClick={createMyAddress}
                    loading={isAddLoading}
                    disabled={isAddLoading}
                    className='mx-auto mt-14 h-[50px] min-w-full rounded-[10px] border-0 bg-primary text-center font-clashmd text-base text-white shadow-none'
                  >
                    Create a New Address
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className='grid gap-5'>
          <div className='rounded-[10px] border border-[#F4F4F4] px-[2%] py-4 lg:rounded-2xl lg:px-5'>
            <div className='flex items-center justify-between'>
              <div className='flex w-fit items-center gap-3 lg:mt-0'>
                {firstStageCompleted ? (
                  <Image
                    alt='tick icon'
                    src='/images/tick.svg'
                    width={24}
                    height={24}
                    className='h-4 w-4 lg:h-6 lg:w-6'
                  />
                ) : (
                  <div className='flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[#FFE0E0] lg:h-6 lg:w-6'>
                    <p className='text-[10px] text-myGray lg:font-clashmd lg:text-sm'>
                      1
                    </p>
                  </div>
                )}

                <p className='font-clashmd text-xs text-myGray lg:text-base'>
                  Customer Address
                </p>
              </div>
              <div>
                {addresses?.length > 0 && !isChange && !firstStageCompleted && (
                  <button
                    onClick={() => setIsChange(!isChange)}
                    className='text-xs text-[#8B1A1A] lg:font-clashmd lg:text-base'
                  >
                    Change Information
                  </button>
                )}
                {isChange && (
                  <button
                    onClick={() => setIsChange(!isChange)}
                    className='text-xs text-primary lg:font-clashmd lg:text-base'
                  >
                    Continue Checkout
                  </button>
                )}
                {firstStageCompleted && (
                  <button
                    onClick={() => setFirstStageCompleted(false)}
                    className='text-xs text-primary lg:font-clashmd lg:text-base'
                  >
                    Modify Checkout
                  </button>
                )}
              </div>
            </div>
            {addresses?.length > 0 ? (
              <div>
                {!isChange ? (
                  <div className='mt-10 rounded-[10px] bg-[#F4F4F4] px-3 py-5 lg:rounded-2xl lg:px-9'>
                    <p className='mb-2 text-xs text-black lg:mb-1 lg:text-base'>
                      <span className='mr-2'>{userInfo?.firstname}</span>
                      <span>{userInfo?.lastname}</span>
                    </p>
                    <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-10'>
                      <p className='text-xs text-black lg:text-base'>
                        {selectedAddress?.deliveryAddress}
                      </p>
                      <p className='text-xs text-black lg:text-base'>
                        {selectedAddress?.phone_number}
                      </p>
                      <p className='text-xs text-black lg:text-base'>
                        {selectedAddress?.city}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className='mt-10'>
                    {addresses.map((address, index) => (
                      <div
                        key={address._id}
                        onClick={() => handleAddressClick(address)}
                        className={`relative mt-3 rounded-[10px] lg:mt-10 ${address._id === selectedAddress._id
                          ? 'bg-primary text-white'
                          : 'bg-[#F4F4F4] text-black'
                          } px-3 py-7 lg:rounded-2xl lg:px-9 lg:py-5`}
                      >
                        <p className='mb-2 text-xs lg:mb-1 lg:text-base'>
                          <span className='mr-2'>{userInfo?.firstname}</span>
                          <span>{userInfo?.lastname}</span>
                        </p>
                        <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-10'>
                          <p className='text-xs lg:text-base'>
                            {address?.deliveryAddress}
                          </p>
                          <p className='text-xs lg:text-base'>
                            {address?.phone_number}
                          </p>
                          <p className='text-xs lg:text-base'>
                            {address?.city}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleEdit(
                              address?.deliveryAddress,
                              address.phone_number,
                              index,
                              address._id,
                              address.city
                            )
                          }
                          className={`${address._id === selectedAddress._id
                            ? 'text-white'
                            : 'text-[#8B1A1A]'
                            } absolute right-2 top-[50%] h-20 w-20 translate-y-[-50%] text-sm lg:text-base`}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                    <div className='flex items-center justify-center pb-3 lg:pb-0'>
                      <button
                        disabled={addresses.length === 3}
                        onClick={() => {
                          setIsAddAddress(true);
                        }}
                        className='mx-auto mt-10 h-[50px] w-[90%] max-w-[395px] rounded-full bg-primary text-center font-clashmd text-base text-white disabled:cursor-not-allowed disabled:bg-[#F8BCBC] lg:w-full'
                      >
                        Add a New Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='mt-10 rounded-[10px] bg-[#F4F4F4] px-3 py-5 lg:rounded-2xl lg:px-9'>
                <p className='mb-1 text-xs text-black lg:text-base'>
                  <span className='mr-2'>{userInfo?.firstname}</span>
                  <span>{userInfo?.lastname}</span>
                </p>
                <div className='flex items-center gap-10'>
                  <p
                    onClick={() => setIsAddAddress(true)}
                    className='cursor-pointer text-xs text-primary lg:text-base'
                  >
                    Add an address to continue
                  </p>
                  <p
                    onClick={() => setIsAddAddress(true)}
                    className='cursor-pointer text-xs text-black lg:text-base'
                  >
                    Add a phone number to continue
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className='rounded-[10px] border border-[#F4F4F4] px-[2%] py-4 lg:rounded-2xl lg:px-5'>
            <div className='flex items-center justify-between'>
              <div className='mt-4 flex w-fit items-center gap-3'>
                {firstStageCompleted ? (
                  <Image
                    alt='tick icon'
                    src='/images/tick.svg'
                    width={24}
                    height={24}
                    className='h-4 w-4 lg:h-6 lg:w-6'
                  />
                ) : (
                  <div className='flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[#FFE0E0] lg:h-6 lg:w-6'>
                    <p className='text-[10px] text-myGray lg:font-clashmd lg:text-sm'>
                      2
                    </p>
                  </div>
                )}
                <p className='font-clashmd text-xs text-myGray lg:text-base'>
                  Delivery Details
                </p>
              </div>
            </div>
            {!isChange && (
              <div className='mt-5 rounded-[10px] bg-[#F4F4F4] px-3 py-7 lg:rounded-2xl lg:px-9'>
                <div>
                  {firstStageCompleted ? (
                    <p className='font-clashmd text-xs text-myGray lg:font-clash lg:text-base'>
                      {selectedDeliveryMethod}
                    </p>
                  ) : (
                    <RadioGroup.Root
                      className='flex flex-col gap-5 font-clashmd text-xs text-myGray lg:flex-row lg:items-center lg:gap-60 lg:font-clash lg:text-base'
                      defaultValue={selectedDeliveryMethod}
                      aria-label='Delivery Method'
                      onValueChange={setSelectedDeliveryMethod}
                    >
                      <RadioItem
                        id='r1'
                        value='Door delivery'
                        labelKey='Door Delivery'
                      />
                      <RadioItem
                        id='r2'
                        value='Pickup delivery'
                        labelKey='Pickup Delivery'
                      />
                    </RadioGroup.Root>
                  )}

                  <div className='mt-5 lg:mt-8'>
                    {selectedDeliveryMethod === 'Door delivery' && (
                      <p className='pl-1 text-[10px] text-[#7C7C7C] lg:pl-0 lg:text-base'>
                        Delivery between {deliveryDates.start} and{' '}
                        {deliveryDates.end}
                      </p>
                    )}
                    {selectedDeliveryMethod === 'Pickup delivery' && (
                      <p className='text-[10px] text-[#7C7C7C] lg:text-base'>
                        Available for pickup between {deliveryDates.start} and{' '}
                        {deliveryDates.end}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {firstStageCompleted && (
              <div className='mt-10 rounded-[10px] bg-[#F4F4F4] px-3 py-7 lg:rounded-2xl lg:px-9'>
                <p className='font-clashmd text-xs text-myGray lg:font-clash lg:text-base'>
                  Shipment({validItems.length})
                </p>
                <div className='mt-5 grid gap-5 lg:grid-cols-2'>
                  {validItems &&
                    validItems.map((item) => (
                      <div
                        key={item?.product?.id}
                        className='flex max-w-[388px] items-center gap-5'
                      >
                        <Image
                          alt='tick icon'
                          src={item?.product?.images[0]}
                          width={56}
                          height={56}
                          className='h-10 w-10 rounded-[8px] lg:h-[56px] lg:w-[56px]'
                        />
                        <div className='text-xs text-myGray lg:text-base lg:leading-[19.68px]'>
                          {item?.product?.productTitle}
                        </div>
                      </div>
                    ))}
                </div>
                <Link
                  href='/cart'
                  className='mx-auto mt-10 flex w-fit items-center gap-2 font-clashmd text-sm text-myGray lg:text-base'
                >
                  Modify Cart <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
          <div className='rounded-[10px] border border-[#F4F4F4] px-[2%] py-4 lg:rounded-2xl lg:px-5'>
            <div className='flex items-center justify-between'>
              <div className='mt-4 flex w-fit items-center gap-3'>
                {firstStageCompleted ? (
                  <Image
                    alt='tick icon'
                    src='/images/tick.svg'
                    width={24}
                    height={24}
                    className='h-4 w-4 lg:h-6 lg:w-6'
                  />
                ) : (
                  <div className='flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[#FFE0E0] lg:h-6 lg:w-6'>
                    <p className='text-[10px] text-myGray lg:font-clashmd lg:text-sm'>
                      3
                    </p>
                  </div>
                )}
                <p className='font-clashmd text-xs text-myGray lg:text-base'>
                  Select Payment Method
                </p>
              </div>
            </div>
            {!isChange && (
              <div className='mt-5 rounded-[10px] bg-[#F4F4F4] px-3 py-7 lg:rounded-2xl lg:px-9 lg:pb-5 lg:pt-10'>
                {firstStageCompleted ? (
                  <RadioGroup.Root
                    className='flex flex-col gap-5 font-clashmd text-xs text-myGray lg:flex-row lg:items-center lg:gap-60 lg:font-clash lg:text-base'
                    defaultValue={selectedPaymentMethod}
                    aria-label='Pay with wallet'
                    onValueChange={setSelectedPaymentMethod}
                  >
                    <RadioItem
                      id='r1'
                      value={selectedPaymentMethod}
                      labelKey={selectedPaymentMethod}
                    />
                  </RadioGroup.Root>
                ) : (
                  <RadioGroup.Root
                    className='flex flex-col gap-5 font-clashmd text-xs text-myGray lg:flex-row lg:items-center lg:gap-60 lg:font-clash lg:text-base'
                    defaultValue={selectedPaymentMethod}
                    aria-label='Pay with wallet'
                    onValueChange={setSelectedPaymentMethod}
                  >
                    <RadioItem
                      id='r3'
                      value='Online'
                      labelKey='Online payment'
                    />
                    <RadioItem
                      id='r4'
                      value='Wallet'
                      labelKey='Pay with wallet'
                    />
                  </RadioGroup.Root>
                )}

                <div className='mt-5 transition-all lg:mt-8'>
                  {selectedPaymentMethod === 'Online' && (
                    <p className='pl-1 text-[10px] text-[#7C7C7C] lg:pl-0 lg:text-base'>
                      Secure, fast, and efficient. Use your credit/debit card or
                      bank account to finalize your purchase instantly.
                    </p>
                  )}
                  {selectedPaymentMethod === 'Wallet' && (
                    <p className='pl-1 text-[10px] text-[#7C7C7C] lg:pl-0 lg:text-base'>
                      Convenient and swift! Use your digital wallet balance to
                      complete your purchase seamlessly.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <OrderSummary
          deliveryMethod={selectedDeliveryMethod}
          firstStage={firstStageCompleted}
          isChange={isChange}
          setFirstStageCompleted={setFirstStageCompleted}
          address={selectedAddress}
          selectedPayment={selectedPaymentMethod}
          point={point}
          wallet={wallet}
          hasWallet={hasWallet}
        />
      </div>
    </ClientOnly>
  );
};

export default CheckoutForm;
