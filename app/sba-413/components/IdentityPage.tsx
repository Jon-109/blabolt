'use client';

import { IdentityData, SmartGateFlags } from '../types';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/(components)/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { ChevronRight, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/(components)/ui/tooltip';

interface IdentityPageProps {
  data: IdentityData;
  smartGate: SmartGateFlags;
  onChange: (data: IdentityData) => void;
  onNext: () => void;
}

// Community property states
const communityPropertyStates = ['AZ', 'CA', 'ID', 'LA', 'NV', 'NM', 'TX', 'WA', 'WI'];

export default function IdentityPage({ data, smartGate, onChange, onNext }: IdentityPageProps) {
  const isCommunityPropertyState = communityPropertyStates.includes(data.applicant_state);

  const handleChange = (field: keyof IdentityData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleValidateAndNext = () => {
    // Basic validation
    if (!data.applicant_name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!data.applicant_email.trim()) {
      alert('Please enter your email');
      return;
    }
    if (!data.as_of_date) {
      alert('Please select an "as of" date');
      return;
    }
    
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Identity & Statement Basics</h2>
        <p className="text-gray-600">
          Let's start with your basic information. This will appear on your SBA Form 413.
        </p>
      </div>

      {/* As of Date Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📅</span>
            Statement Date
          </CardTitle>
          <CardDescription>
            Use today or a recent statement date (SBA prefers within the last 90–120 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="as_of_date">As of Date *</Label>
            <Input
              id="as_of_date"
              type="date"
              value={data.as_of_date}
              onChange={(e) => handleChange('as_of_date', e.target.value)}
              className="mt-2"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Filing Type Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>👤</span>
            Filing Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filing_type"
                  value="individual"
                  checked={data.filing_type === 'individual'}
                  onChange={(e) => {
                    handleChange('filing_type', 'individual');
                    handleChange('spouse_included', false);
                  }}
                  className="w-4 h-4"
                />
                <span className="font-medium">Individual</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filing_type"
                  value="joint"
                  checked={data.filing_type === 'joint'}
                  onChange={(e) => {
                    handleChange('filing_type', 'joint');
                    handleChange('spouse_included', true);
                  }}
                  className="w-4 h-4"
                />
                <span className="font-medium">Joint (with spouse)</span>
                {smartGate.is_sba && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    Recommended for SBA
                  </span>
                )}
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applicant Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📝</span>
            Your Information
          </CardTitle>
          <CardDescription>
            Enter your information as it appears on official documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="applicant_name">Full Legal Name *</Label>
              <Input
                id="applicant_name"
                type="text"
                placeholder="John Michael Smith"
                value={data.applicant_name}
                onChange={(e) => handleChange('applicant_name', e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="applicant_email">Email Address *</Label>
              <Input
                id="applicant_email"
                type="email"
                placeholder="john@example.com"
                value={data.applicant_email}
                onChange={(e) => handleChange('applicant_email', e.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="applicant_phone">Mobile Phone</Label>
              <Input
                id="applicant_phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={data.applicant_phone}
                onChange={(e) => handleChange('applicant_phone', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="applicant_address_1">Home Address *</Label>
            <Input
              id="applicant_address_1"
              type="text"
              placeholder="123 Main Street"
              value={data.applicant_address_1}
              onChange={(e) => handleChange('applicant_address_1', e.target.value)}
              className="mt-2"
              required
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="applicant_city">City *</Label>
              <Input
                id="applicant_city"
                type="text"
                placeholder="San Francisco"
                value={data.applicant_city}
                onChange={(e) => handleChange('applicant_city', e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="applicant_state">State *</Label>
              <Input
                id="applicant_state"
                type="text"
                placeholder="CA"
                maxLength={2}
                value={data.applicant_state}
                onChange={(e) => handleChange('applicant_state', e.target.value.toUpperCase())}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="applicant_zip">ZIP Code *</Label>
              <Input
                id="applicant_zip"
                type="text"
                placeholder="94102"
                maxLength={10}
                value={data.applicant_zip}
                onChange={(e) => handleChange('applicant_zip', e.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>

          {/* Community Property Helper */}
          {isCommunityPropertyState && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-blue-900 mb-1">
                    Community Property State
                  </div>
                  <p className="text-sm text-blue-800">
                    You're in {data.applicant_state}, a community property state. Certain assets acquired during marriage may be shared. We'll help you include what lenders expect.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spouse Information Card (if joint filing) */}
      {data.filing_type === 'joint' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>💑</span>
              Spouse Information
            </CardTitle>
            <CardDescription>
              Your spouse will need to review and sign this statement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="spouse_name">Spouse's Full Legal Name</Label>
                <Input
                  id="spouse_name"
                  type="text"
                  placeholder="Jane Elizabeth Smith"
                  value={data.spouse_name || ''}
                  onChange={(e) => handleChange('spouse_name', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Information Card (optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏢</span>
            Business Information
            <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </CardTitle>
          <CardDescription>
            If applying for a business loan, include your business details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="business_name">Business Legal Name</Label>
              <Input
                id="business_name"
                type="text"
                placeholder="Acme Corporation LLC"
                value={data.business_name || ''}
                onChange={(e) => handleChange('business_name', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="entity_type">Entity Type</Label>
              <Input
                id="entity_type"
                type="text"
                placeholder="LLC, S-Corp, Partnership, etc."
                value={data.entity_type || ''}
                onChange={(e) => handleChange('entity_type', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="business_address_1">Business Address</Label>
            <Input
              id="business_address_1"
              type="text"
              placeholder="456 Business Blvd"
              value={data.business_address_1 || ''}
              onChange={(e) => handleChange('business_address_1', e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="business_city">City</Label>
              <Input
                id="business_city"
                type="text"
                placeholder="San Francisco"
                value={data.business_city || ''}
                onChange={(e) => handleChange('business_city', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="business_state">State</Label>
              <Input
                id="business_state"
                type="text"
                placeholder="CA"
                maxLength={2}
                value={data.business_state || ''}
                onChange={(e) => handleChange('business_state', e.target.value.toUpperCase())}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="business_zip">ZIP Code</Label>
              <Input
                id="business_zip"
                type="text"
                placeholder="94102"
                maxLength={10}
                value={data.business_zip || ''}
                onChange={(e) => handleChange('business_zip', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleValidateAndNext}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          Continue to Assets
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
