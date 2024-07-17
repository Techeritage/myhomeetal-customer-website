'use client';
import { constants } from '@/app/utils/constants';
import { hasCookie } from 'cookies-next';
import Image from 'next/image';
import React from 'react';
import ClientOnly from '../ClientOnly';
import Link from 'next/link';

export default function ReferralDashBoard2() {
  return (
    <div className='relative flex h-[256px] w-full items-center justify-center overflow-hidden rounded-2xl bg-primaryBg lg:h-[493px] lg:max-w-[1360px] lg:justify-between lg:rounded-3xl lg:pl-[5%]'>
      <div className='z-20 lg:z-0'>
        <div className='mx-auto mb-8 max-w-[224px] lg:mx-0 lg:max-w-[460px]'>
          <h1 className='mb-3 text-center font-clashmd text-xs text-white lg:mb-4 lg:max-w-[352px] lg:text-start lg:text-[39px] lg:leading-[47.97px]'>
            Welcome to our referral program
          </h1>
          <p className='w-full text-center text-[10px] leading-[12.3px] text-white lg:text-start lg:text-base lg:leading-[19.09px]'>
            Invite your friends to shop with us and earn exciting rewards for
            every successful referral.
          </p>
        </div>
        <ClientOnly>
          {hasCookie(constants.AUTH_TOKEN) ? (
            <>
              <div className='mb-4 flex h-[50px] w-full min-w-[300px] items-center justify-between rounded-2xl bg-white pl-7 pr-2 lg:h-[56px] lg:min-w-[516px]'>
                <p className='text-[10px] text-[#989898] lg:text-xs'>
                  https://www.myhomeetal.com/referral?code=XYZ123
                </p>
                <button className='hidden h-[47px] w-[113px] rounded-2xl bg-primaryBg font-clashsm text-xs text-white lg:block'>
                  Copy Code
                </button>
              </div>
              <div className='flex items-center justify-center'>
                <button className='h-[34px] w-[157px] rounded-full bg-white font-clashsm text-[10px] text-primaryBg lg:hidden'>
                  Copy Code
                </button>
              </div>
            </>
          ) : (
            <div className='ml-3'>
              <Link
                href='/login'
                className='mr-4 rounded-full bg-white px-6 py-4 font-clashsm text-xs text-myGray'
              >
                Login
              </Link>
              <Link
                href='/register'
                className='rounded-full bg-white px-6 py-4 font-clashsm text-xs text-myGray'
              >
                Create an Account
              </Link>
            </div>
          )}
        </ClientOnly>
      </div>

      <Image
        src='/images/referralIcon2.svg'
        width={207}
        height={211}
        alt='referral Icon'
        className='absolute bottom-0 left-[-50px] lg:hidden'
        loading='lazy'
      />
      <div className='relative hidden lg:block'>
        <Image
          src='/images/referralIcon3.svg'
          width={553}
          height={553}
          alt='referral Icon'
          loading='lazy'
          className='mr-5'
        />
        <Image
          src='/images/referralIcon2.svg'
          width={732.27}
          height={732.27}
          alt='referral Icon'
          className='absolute bottom-0 right-0 z-10'
          loading='lazy'
        />
      </div>
    </div>
  );
}
