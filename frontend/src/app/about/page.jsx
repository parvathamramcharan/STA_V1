"use client";

import React from "react";
import {
  Database,
  Shield,
  Globe,
  Search,
  BarChart3,
  FileText,
  User,
  UserCog,
  Network,
  Activity,
  MapPin,
  Server,
  Lock,
  Eye,
  Download,
  CheckCircle2,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Sinkhole Traffic Analysis Framework
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3.5xl mx-auto leading-relaxed">
            The Sinkhole Traffic Analysis Framework collects and analyzes
            sinkholed network traffic from PCAP datasets. The framework
            identifies system IPs that communicate with suspicious domains and
            IP addresses, processes captured network traffic and extracts
            meaningful intelligence from identified IPs.
          </p>
        </div>

        {/* Overview Section */}
        <div className="mb-16 p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800">
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            The framework analyzes collected traffic and supports PCAP
            summaries, traffic distribution, IP search, PCAP insights, reports
            and external connection analysis from the uploaded PCAP files. It
            identifies victims (IPs) communicating with malicious domains or the
            IP addresses and examines traffic data to identify details with
            respect to interactions across hosts, domains, countries and service
            providers.
          </p>
        </div>

        {/* Core Modules */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Database className="size-8 text-blue-600 dark:text-blue-400" />
            Core Modules
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="size-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold">
                  1. Overall PCAPs Dashboard
                </h3>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <FileText className="size-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">2. PCAP-wise Analysis</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Module 1: Overall PCAPs Dashboard */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">
              1. Overall PCAPs Dashboard
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              The Dashboard provides a global view of external IP addresses
              identified from processed PCAP datasets that communicate with
              victim and malicious IPs. It displays identified IP locations on
              an interactive world map and shows the geographic distribution of
              observed network traffic. The Dashboard aggregates data across all
              PCAP files, providing a network-wide view of IP activity.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
              Each highlighted location on the map represents an IP activity
              from the analyzed traffic captures and summarizes details such as:
            </p>
            <ul className="mt-4 space-y-2 ml-6">
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                Total identified IP count
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                Number of captures observed
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                Packet volume information
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            {/* PCAP Summary */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <FileText className="size-6 text-blue-600 dark:text-blue-400" />
                PCAP Summary
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The PCAP Summary section provides high-level statistical
                information extracted from the uploaded PCAP datasets, offering
                a quick understanding of overall traffic volume and network
                activity.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium">
                The section includes:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Total number of PCAP files
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Total packet count
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Internal IP count
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  External IP count
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Number of affected hosts
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Total traffic duration
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Total data transferred
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Total network connections
                </div>
              </div>
            </div>

            {/* Traffic Distribution */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Activity className="size-6 text-purple-600 dark:text-purple-400" />
                Traffic Distribution
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The Traffic Distribution section analyzes protocol-level and
                traffic behavior data through graphical visualizations and
                charts.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium">
                The section includes:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  Transport layer distribution (TCP and UDP traffic)
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  Application protocol distribution
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  Frequently observed URLs
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  DNS query analysis
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  Server domain analysis
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  Inbound and outbound traffic distribution
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                This section enables review of traffic composition,
                communication behavior, and commonly accessed domains across the
                analyzed network captures.
              </p>
            </div>

            {/* IP Search */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Search className="size-6 text-green-600 dark:text-green-400" />
                IP Search
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The IP Search section supports detailed look up and analysis of
                a specific IP address from processed traffic data, including
                related network and ownership information from the analyzed
                datasets and associated lookup sources.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium">
                The section provides details such as:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  Host identity information
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  Open ports and detected services
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  Protocol information
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  Operating system match details
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  DNS and hostname information
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  Geographic location details
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  Organization and service provider information
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  Contact and ownership information
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  Scan and record details
                </div>
              </div>
            </div>

            {/* PCAP Insights */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Eye className="size-6 text-orange-600 dark:text-orange-400" />
                PCAP Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The PCAP Insights section provides summarized observations from
                the processed PCAP datasets. It helps to quickly identify the
                most active entities present in the analyzed network captures.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium">
                The section includes summarized information such as:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Top active IP addresses
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Top communicating countries
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Top cities/states
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Top service providers
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Top affected internal hosts
                </div>
              </div>
            </div>

            {/* Reports */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <FileText className="size-6 text-red-600 dark:text-red-400" />
                Reports
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The Reports section provides categorized traffic analysis based
                on the processed PCAP datasets. The reports are organized to
                help examine identified IP activity in a structured manner.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium">
                The section mainly includes:
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  Country-wise reports
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  ISP-wise reports
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Specific entries can be browsed and searched to view related IP
                details along with associated network and provider information.
                The section includes a map for geographic visualization and
                supports a downloadable report for the selected category.
              </p>
            </div>
          </div>
        </div>

        {/* Module 2: PCAP-wise Analysis */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">2. PCAP-wise Analysis</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              The PCAP module provides detailed file-level analysis for the
              uploaded PCAP datasets. It allows browsing individual capture
              files and examining the network traffic information extracted from
              each PCAP.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
              The module organizes PCAP files in a structured card-based view,
              making it easier to access and analyze captured traffic data.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-6 mb-3 font-medium">
              Each PCAP entry includes basic information such as:
            </p>
            <div className="grid md:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                PCAP file name
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                File size
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                Packet count
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                Traffic duration
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                External IP count
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              The module supports search, filtering, sorting, and pagination for
              efficient navigation across large PCAP datasets.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 mb-8">
            <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium">
              A specific PCAP file can be opened to access detailed traffic
              analysis sections, including:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                PCAP Summary
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                IP Geo-Map
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                Traffic Distribution
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                PCAP Insights
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                Reports
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                IP Search
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              This module helps perform focused analysis on individual traffic
              captures and understand communication activity within a specific
              PCAP dataset.
            </p>
          </div>

          {/* Detailed subsections */}
          <div className="space-y-6">
            {/* PCAP Summary */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                <FileText className="size-5 text-blue-600 dark:text-blue-400" />
                PCAP Summary
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The PCAP Summary section provides detailed traffic and
                communication analysis for the selected PCAP file.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                In addition to the summary statistics available in the Dashboard
                view, this section also includes:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Session timeline visualization
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Detailed connection logs
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Source and destination IP details
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Port, protocol, and service information
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  Connection timestamps and traffic status
                </div>
              </div>
            </div>

            {/* IP Geo-Map */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                <MapPin className="size-5 text-green-600 dark:text-green-400" />
                IP Geo-Map
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The IP Geo-Map section visualizes the geographic distribution of
                external IP addresses identified within the selected PCAP file.
                It displays communication paths between internal hosts and
                external locations on an interactive world map.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                The section shows where network connections originate and how
                traffic is distributed across regions. The map also displays
                identified external IP locations across the analyzed traffic
                data.
              </p>
            </div>

            {/* Traffic Distribution */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                <Activity className="size-5 text-purple-600 dark:text-purple-400" />
                Traffic Distribution
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This section provides protocol-level traffic analysis using
                graphical visualizations and charts. It covers the same analysis
                available in the Dashboard view, applied to the selected PCAP
                dataset.
              </p>
            </div>

            {/* PCAP Insights */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                <Eye className="size-5 text-orange-600 dark:text-orange-400" />
                PCAP Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The PCAP Insights section provides summarized observations
                extracted from the selected PCAP file to help examine important
                communication details and frequently observed network entities.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                The section includes:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Internal and external IP activity details
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  DNS query analysis
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Frequently accessed URLs
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Extracted file information from captured traffic
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Network port and protocol activity
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  Identified user agent details
                </div>
              </div>
            </div>

            {/* Reports */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                <FileText className="size-5 text-red-600 dark:text-red-400" />
                Reports
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The Reports section at the PCAP level provides the same
                reporting functionality as the Dashboard Reports section, but
                limits analysis to the currently selected PCAP file. These
                reports can be downloaded.
              </p>
            </div>

            {/* IP Search */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                <Search className="size-5 text-green-600 dark:text-green-400" />
                IP Search
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The IP Search section at the PCAP level provides the same IP
                lookup and analysis functionality available in the Dashboard IP
                Search section, but the analysis is limited to IP addresses
                identified within the selected PCAP file.
              </p>
            </div>
          </div>
        </div>

        {/* User Roles Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <UserCog className="size-8 text-blue-600 dark:text-blue-400" />
            User Roles
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            The framework supports two types of user roles: Admin and User. Each
            role is provided with access based on the functionalities assigned
            within the framework.
          </p>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Admin Role */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                  <Lock className="size-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold">Admin</h3>
              </div>
              <div className="flex-grow">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The Admin role has complete access to the framework,
                  including:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Dashboard analytics
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    PCAP management and analysis
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Traffic visualization
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    PCAP insights
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    IP search and detailed lookup
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Country-wise and ISP-wise reports
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Report download functionalities
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-6">
                Admins can perform full traffic analysis and access all
                available modules within the framework.
              </p>
            </div>

            {/* User Role */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-lg bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
                  <User className="size-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold">User</h3>
              </div>
              <div className="flex-grow">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The User role has limited access focused on report viewing
                  functionality.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium">
                  Users can:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    Browse available PCAP report entries
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    Access Country-wise reports
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    Access ISP-wise reports
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    View categorized IP information and related network details
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    Download generated PDF reports
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700">
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    The downloadable reports contain categorized IP analysis
                    along with associated provider, location, network status,
                    and communication-related information for the selected
                    report type.
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-6">
                This role is intended to provide access to generated reports
                without access to the full analytical dashboard and PCAP
                analysis sections.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Network className="size-5" />
            <span>Sinkhole Traffic Analysis Framework</span>
          </div>
        </div>
      </div>
    </div>
  );
}
