'use client';

import Link from "next/link";
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';


export default function SignupPage() {
  const { locale }    = useParams<{ locale: string }>();
  const tRegistration = useTranslations('Registration');
  const tValidation   = useTranslations('Validation');

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center mb-6">
            {tRegistration('createAnAccount')}
          </h1>

          <form className="mb-5">
            <div className="form-control">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">{tRegistration("displayedName")}</legend>
                <input 
                  type="text" 
                  className="input" 
                  placeholder={`${tRegistration('displayedName').toLowerCase()} (${tValidation('requiredField')})`} 
                  required
                />
              </fieldset>
            </div>

            <div className="form-control">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email</legend>
                <input 
                  type="email"
                  className="input"
                  placeholder="Type email"
                  required
                />
              </fieldset>
            </div>

            <div className="form-control">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Password</legend>
                <input 
                  type="password" 
                  className="input" 
                  placeholder="Type password" 
                  required  
                />
              </fieldset>
            </div>

            <div className="form-control">
             <fieldset className="fieldset">
                <legend className="fieldset-legend">Confirm password</legend>
                <input 
                  type="password" 
                  className="input" 
                  placeholder="Type the same password again" 
                  required  
                />
              </fieldset>
            </div>
          </form>

          <button className="btn btn-secondary w-full">
            Sign up
          </button>
          <div className="divider">OR</div>
          <p className="text-center text-sm">
            Already have an account?
            <Link 
              href={`/${locale}/login`}
              className="link link-primary ml-1">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
